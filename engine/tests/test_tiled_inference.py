"""
Unit tests for tiled inference logic: splitting, feather blending, padding, and reassembly.
"""

import sys
from pathlib import Path
import numpy as np

engine_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(engine_dir))

from pipeline.tiled_inference import (
    split_into_tiles,
    reassemble_tiles,
    preprocess_tile_for_onnx,
    postprocess_onnx_output,
)


def test_tiling_roundtrip_identity():
    """
    Test splitting an image and reassembling with a 1x dummy scale.
    Output dimensions should match and colors should be preserved.
    """
    h, w, c = 360, 640, 3
    # Synthetic gradient image
    img = np.zeros((h, w, c), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            img[y, x, 0] = (x * 255) // w
            img[y, x, 1] = (y * 255) // h
            img[y, x, 2] = 128

    tile_size = 128
    overlap = 16
    tiles = split_into_tiles(img, tile_size=tile_size, overlap=overlap)
    assert len(tiles) > 0

    # Simulate identity "inference" (1x)
    reassembled = reassemble_tiles(
        tiles, output_h=h, output_w=w, scale=1, overlap=overlap
    )

    assert reassembled.shape == (h, w, 3)
    # Check max difference due to feather blending
    diff = np.abs(img.astype(int) - reassembled.astype(int))
    max_diff = np.max(diff)
    mean_diff = np.mean(diff)
    print(f"Identity tiling roundtrip: max_diff={max_diff}, mean_diff={mean_diff:.4f}")
    assert max_diff <= 2, f"Expected minimal error in feather blending, got {max_diff}"


def test_tiling_2x_dummy_scale():
    """
    Test splitting an image and reassembling with 2x upscale simulation.
    """
    h, w, c = 180, 320, 3
    img = np.random.randint(0, 256, (h, w, c), dtype=np.uint8)

    tile_size = 128
    overlap = 16
    tiles = split_into_tiles(img, tile_size=tile_size, overlap=overlap)

    # Simulate 2x nearest neighbor upscale for each tile
    scale = 2
    for t in tiles:
        # Upscale tile by 2x
        tile = t["tile"]
        th, tw = tile.shape[:2]
        upscaled_tile = np.repeat(np.repeat(tile, scale, axis=0), scale, axis=1)
        t["tile"] = upscaled_tile

    out_h = h * scale
    out_w = w * scale
    reassembled = reassemble_tiles(
        tiles, output_h=out_h, output_w=out_w, scale=scale, overlap=overlap
    )

    assert reassembled.shape == (out_h, out_w, 3)
    print(f"2x Reassembly succeeded with shape {reassembled.shape}")


def test_onnx_pre_post_process():
    tile = np.random.randint(0, 256, (128, 128, 3), dtype=np.uint8)
    tensor = preprocess_tile_for_onnx(tile)
    assert tensor.shape == (1, 3, 128, 128)
    assert tensor.dtype == np.float32
    assert tensor.min() >= 0.0 and tensor.max() <= 1.0

    restored = postprocess_onnx_output(tensor)
    assert restored.shape == (128, 128, 3)
    assert restored.dtype == np.uint8
    diff = np.max(np.abs(tile.astype(int) - restored.astype(int)))
    assert diff <= 1
    print("Pre/post process tensor conversions validated.")


if __name__ == "__main__":
    test_tiling_roundtrip_identity()
    test_tiling_2x_dummy_scale()
    test_onnx_pre_post_process()
    print("All tiled inference tests passed!")
