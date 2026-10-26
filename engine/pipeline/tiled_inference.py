"""
ProStudio Engine — Tiled Inference Pipeline.

Splits large frames into overlapping tiles, runs ONNX inference on each tile,
and reassembles them with linear feather blending to prevent seam artifacts.

Designed for the 4 GB VRAM constraint of the RTX 3050 Laptop GPU.
"""

import math
import logging
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


def split_into_tiles(
    image: np.ndarray,
    tile_size: int = 256,
    overlap: int = 32,
) -> list[dict]:
    """
    Split an image (H, W, C) into overlapping tiles.

    Args:
        image: Input image as numpy array (H, W, C), uint8.
        tile_size: Size of each square tile in pixels.
        overlap: Overlap between adjacent tiles in pixels.

    Returns:
        List of dicts with keys: 'tile' (np.ndarray), 'x', 'y', 'w', 'h'
        where x, y are the top-left position in the original image.
    """
    h, w, c = image.shape
    step = max(1, tile_size - overlap)
    tiles = []

    y_points = list(range(0, h, step))
    # Make sure the last row reaches the bottom edge
    if y_points and y_points[-1] + tile_size < h:
        y_points.append(h - tile_size if h >= tile_size else 0)

    x_points = list(range(0, w, step))
    # Make sure the last column reaches the right edge
    if x_points and x_points[-1] + tile_size < w:
        x_points.append(w - tile_size if w >= tile_size else 0)

    # Deduplicate while preserving order
    y_points = sorted(list(set([max(0, yp) for yp in y_points])))
    x_points = sorted(list(set([max(0, xp) for xp in x_points])))

    for y in y_points:
        for x in x_points:
            x_end = min(x + tile_size, w)
            y_end = min(y + tile_size, h)
            x_start = x
            y_start = y

            tile = image[y_start:y_end, x_start:x_end]

            # Pad if tile is smaller than tile_size (e.g. image smaller than tile)
            actual_h, actual_w = tile.shape[:2]
            if actual_h < tile_size or actual_w < tile_size:
                padded = np.zeros((tile_size, tile_size, c), dtype=image.dtype)
                padded[:actual_h, :actual_w] = tile
                tile = padded

            tiles.append({
                "tile": tile,
                "x": x_start,
                "y": y_start,
                "w": actual_w,
                "h": actual_h,
            })

    logger.debug(
        "Split %dx%d image into %d tiles (%dpx, %dpx overlap)",
        w, h, len(tiles), tile_size, overlap,
    )
    return tiles


def _build_feather_mask(
    tile_h: int,
    tile_w: int,
    overlap: int,
    is_top_edge: bool = False,
    is_bottom_edge: bool = False,
    is_left_edge: bool = False,
    is_right_edge: bool = False,
) -> np.ndarray:
    """
    Build a 2D linear feather mask for blending overlapping tiles.

    Only feathers edges that overlap with adjacent tiles (internal edges).
    Outer image boundaries maintain full weight (1.0).
    """
    mask = np.ones((tile_h, tile_w), dtype=np.float32)

    if overlap <= 0:
        return mask

    ramp = np.linspace(0.0, 1.0, overlap, dtype=np.float32)

    # Top internal edge ramp
    if not is_top_edge and tile_h > overlap:
        mask[:overlap, :] *= ramp[:, np.newaxis]
    # Bottom internal edge ramp
    if not is_bottom_edge and tile_h > overlap:
        mask[-overlap:, :] *= ramp[::-1, np.newaxis]
    # Left internal edge ramp
    if not is_left_edge and tile_w > overlap:
        mask[:, :overlap] *= ramp[np.newaxis, :]
    # Right internal edge ramp
    if not is_right_edge and tile_w > overlap:
        mask[:, -overlap:] *= ramp[::-1][np.newaxis, :]

    return mask


def reassemble_tiles(
    tiles: list[dict],
    output_h: int,
    output_w: int,
    scale: int,
    overlap: int = 32,
) -> np.ndarray:
    """
    Reassemble upscaled tiles into a full image with feather blending.

    Args:
        tiles: List of dicts with 'tile' (upscaled np.ndarray), 'x', 'y', 'w', 'h'.
        output_h: Expected output image height.
        output_w: Expected output image width.
        scale: Upscale factor (e.g. 2 or 4).
        overlap: Overlap used during splitting (in input pixels).

    Returns:
        Reassembled image as numpy array (output_h, output_w, 3), uint8.
    """
    channels = 3
    canvas = np.zeros((output_h, output_w, channels), dtype=np.float32)
    weight_map = np.zeros((output_h, output_w), dtype=np.float32)

    scaled_overlap = overlap * scale

    for t in tiles:
        upscaled = t["tile"].astype(np.float32)

        # Target position in output space
        out_x = t["x"] * scale
        out_y = t["y"] * scale
        out_w = min(t["w"] * scale, output_w - out_x)
        out_h = min(t["h"] * scale, output_h - out_y)

        # Crop upscaled tile to the valid region
        crop = upscaled[:out_h, :out_w]

        # Determine whether this tile touches outer boundaries
        is_top = (out_y == 0)
        is_left = (out_x == 0)
        is_bottom = (out_y + out_h >= output_h)
        is_right = (out_x + out_w >= output_w)

        # Build feather mask for internal seams only
        mask = _build_feather_mask(
            out_h, out_w, scaled_overlap,
            is_top_edge=is_top,
            is_bottom_edge=is_bottom,
            is_left_edge=is_left,
            is_right_edge=is_right,
        )

        # Accumulate weighted contributions
        canvas[out_y : out_y + out_h, out_x : out_x + out_w] += (
            crop * mask[:, :, np.newaxis]
        )
        weight_map[out_y : out_y + out_h, out_x : out_x + out_w] += mask

    # Normalize by accumulated weights
    weight_map = np.maximum(weight_map, 1e-8)
    canvas /= weight_map[:, :, np.newaxis]

    return np.clip(canvas, 0, 255).astype(np.uint8)


def preprocess_tile_for_onnx(tile: np.ndarray) -> np.ndarray:
    """
    Preprocess a tile for ONNX model input.

    Converts from (H, W, C) uint8 [0, 255] to (1, C, H, W) float32 [0, 1].
    """
    # (H, W, C) → (C, H, W)
    tile_chw = tile.transpose(2, 0, 1).astype(np.float32) / 255.0
    # Add batch dimension: (1, C, H, W)
    return tile_chw[np.newaxis, :]


def postprocess_onnx_output(output: np.ndarray) -> np.ndarray:
    """
    Postprocess ONNX model output back to an image.

    Converts from (1, C, H, W) float32 [0, 1] to (H, W, C) uint8 [0, 255].
    """
    # Remove batch dim: (C, H, W)
    if output.ndim == 4:
        output = output[0]
    # (C, H, W) → (H, W, C)
    img = output.transpose(1, 2, 0)
    # Clamp and scale
    img = np.clip(img * 255.0, 0, 255).astype(np.uint8)
    return img
