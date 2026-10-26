"""
ProStudio Engine — Real-ESRGAN Upscale Worker.

Orchestrates the full upscaling pipeline:
1. Extract frames via FFmpeg
2. Load ONNX model
3. For each frame: tile → infer → reassemble
4. Encode upscaled frames back via FFmpeg

Reports honest progress via callbacks. Never fakes processing.
"""

import os
import time
import uuid
import shutil
import logging
import tempfile
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable

import numpy as np
from PIL import Image

from .gpu_detect import detect_gpu, select_tile_size
from .ffmpeg_bridge import probe_video, extract_frames, encode_video, verify_output
from .tiled_inference import (
    split_into_tiles,
    reassemble_tiles,
    preprocess_tile_for_onnx,
    postprocess_onnx_output,
)

logger = logging.getLogger(__name__)

_ENGINE_DIR = Path(__file__).resolve().parent.parent
_MODELS_DIR = _ENGINE_DIR / "models"


class JobStatus(str, Enum):
    QUEUED = "queued"
    EXTRACTING = "extracting"
    PROCESSING = "processing"
    ENCODING = "encoding"
    VERIFYING = "verifying"
    COMPLETE = "complete"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class UpscaleJob:
    """Represents a single upscale job with its full state."""

    job_id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    input_path: str = ""
    output_path: str = ""
    model_name: str = "realesr-animevideov3"
    scale: int = 2
    tile_size: int = 256
    overlap: int = 32

    # Status tracking
    status: JobStatus = JobStatus.QUEUED
    frames_total: int = 0
    frames_completed: int = 0
    current_fps: float = 0.0
    eta_seconds: float = 0.0
    vram_used_mb: int = 0
    error_message: str = ""

    # Internal
    _cancelled: bool = False
    _temp_dir: str = ""

    def cancel(self):
        self._cancelled = True
        self.status = JobStatus.CANCELLED


# Model registry: maps model names to ONNX file paths
MODEL_REGISTRY = {
    "realesr-animevideov3": {
        "filename": "realesr-animevideov3.onnx",
        "scale": 4,  # Native scale of this model
        "description": "Compact model optimized for video temporal consistency",
    },
    "realesr-general-x4v3": {
        "filename": "realesr-general-x4v3.onnx",
        "scale": 4,
        "description": "General purpose x4 upscaler for natural video",
    },
    "realesrgan-x4plus": {
        "filename": "RealESRGAN_x4plus.onnx",
        "scale": 4,
        "description": "Maximum detail x4 upscaler (larger model, slower)",
    },
}


def list_available_models() -> list[dict]:
    """List models that have ONNX weights downloaded."""
    available = []
    for name, info in MODEL_REGISTRY.items():
        onnx_path = _MODELS_DIR / info["filename"]
        available.append({
            "name": name,
            "description": info["description"],
            "native_scale": info["scale"],
            "downloaded": onnx_path.is_file(),
            "file_size_mb": round(onnx_path.stat().st_size / 1e6, 1)
            if onnx_path.is_file()
            else None,
        })
    return available


def _load_onnx_session(model_name: str, provider: str):
    """
    Load an ONNX Runtime inference session for the specified model.

    Falls back through providers: CUDA → DirectML → CPU.
    """
    import onnxruntime as ort

    model_info = MODEL_REGISTRY.get(model_name)
    if model_info is None:
        raise ValueError(f"Unknown model: {model_name}. Available: {list(MODEL_REGISTRY.keys())}")

    onnx_path = _MODELS_DIR / model_info["filename"]
    if not onnx_path.is_file():
        raise FileNotFoundError(
            f"Model file not found: {onnx_path}. "
            f"Download the ONNX weights and place them in engine/models/"
        )

    # Build provider list with fallbacks
    providers = []
    if provider == "DmlExecutionProvider":
        providers.append("DmlExecutionProvider")
    elif provider == "CUDAExecutionProvider":
        providers.append(("CUDAExecutionProvider", {
            "device_id": 0,
            "arena_extend_strategy": "kSameAsRequested",
            "cudnn_conv_algo_search": "DEFAULT",
        }))
    if "DmlExecutionProvider" not in providers:
        providers.append("DmlExecutionProvider")
    providers.append("CPUExecutionProvider")

    available = ort.get_available_providers()
    logger.info("ONNX Runtime available providers: %s", available)

    # Filter to actually available providers
    filtered = []
    for p in providers:
        p_name = p[0] if isinstance(p, tuple) else p
        if p_name in available:
            filtered.append(p)

    if not filtered:
        filtered = ["CPUExecutionProvider"]

    logger.info("Loading model %s with providers: %s", model_name, filtered)

    sess_options = ort.SessionOptions()
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    sess_options.intra_op_num_threads = 4

    session = ort.InferenceSession(str(onnx_path), sess_options, providers=filtered)

    actual_provider = session.get_providers()[0]
    logger.info("Model loaded. Active provider: %s", actual_provider)

    return session, model_info["scale"]


def run_upscale(
    job: UpscaleJob,
    on_progress: Callable[[UpscaleJob], None] | None = None,
) -> UpscaleJob:
    """
    Execute a full upscaling pipeline for one video.

    This is the main entry point for processing. It:
    1. Probes the input video
    2. Extracts frames via FFmpeg
    3. Loads the ONNX model
    4. Processes each frame with tiled inference
    5. Encodes the upscaled frames back to video
    6. Verifies the output

    Args:
        job: UpscaleJob with input_path and parameters set.
        on_progress: Callback invoked after each frame with updated job state.

    Returns:
        The same UpscaleJob instance with status/results updated.
    """

    def _report():
        if on_progress:
            on_progress(job)

    try:
        # ── 1. Validate input ──
        if not os.path.isfile(job.input_path):
            raise FileNotFoundError(f"Input file not found: {job.input_path}")

        # ── 2. Detect GPU at runtime ──
        gpu = detect_gpu()
        job.vram_used_mb = gpu["vram_total_mb"] - gpu["vram_free_mb"]

        # Auto-select tile size if not explicitly set
        if job.tile_size <= 0:
            job.tile_size = select_tile_size(gpu["vram_free_mb"])
        logger.info("Using tile size: %dpx on %s", job.tile_size, gpu["name"])

        # ── 3. Probe input video ──
        video_info = probe_video(job.input_path)
        job.frames_total = video_info["total_frames"]
        job.status = JobStatus.EXTRACTING
        _report()

        # ── 4. Create temp directories ──
        job._temp_dir = tempfile.mkdtemp(prefix="prostudio_upscale_")
        frames_dir = os.path.join(job._temp_dir, "frames")
        upscaled_dir = os.path.join(job._temp_dir, "upscaled")
        os.makedirs(frames_dir, exist_ok=True)
        os.makedirs(upscaled_dir, exist_ok=True)

        # ── 5. Extract frames ──
        logger.info("Extracting frames from %s", job.input_path)
        frame_count = extract_frames(job.input_path, frames_dir)
        job.frames_total = frame_count
        _report()

        if job._cancelled:
            job.status = JobStatus.CANCELLED
            _report()
            return job

        # ── 6. Load ONNX model ──
        job.status = JobStatus.PROCESSING
        _report()

        session, model_native_scale = _load_onnx_session(job.model_name, gpu["provider"])
        input_name = session.get_inputs()[0].name

        # Determine effective scale
        # Real-ESRGAN models are fixed 4x; for 2x output we downscale after
        effective_scale = model_native_scale
        downscale_after = job.scale < model_native_scale

        # ── 7. Process each frame ──
        start_time = time.time()
        frame_files = sorted([
            f for f in os.listdir(frames_dir)
            if f.startswith("frame_") and f.endswith(".png")
        ])

        for idx, fname in enumerate(frame_files):
            if job._cancelled:
                job.status = JobStatus.CANCELLED
                _report()
                return job

            frame_path = os.path.join(frames_dir, fname)
            img = np.array(Image.open(frame_path).convert("RGB"))
            h, w, c = img.shape

            # Target output dimensions
            out_w = w * effective_scale
            out_h = h * effective_scale

            # Split into tiles
            tiles = split_into_tiles(img, tile_size=job.tile_size, overlap=job.overlap)

            # Infer each tile
            for t in tiles:
                input_tensor = preprocess_tile_for_onnx(t["tile"])
                onnx_output = session.run(None, {input_name: input_tensor})[0]
                t["tile"] = postprocess_onnx_output(onnx_output)

            # Reassemble
            upscaled = reassemble_tiles(
                tiles, out_h, out_w, scale=effective_scale, overlap=job.overlap
            )

            # If user requested 2x but model is 4x, downscale
            if downscale_after:
                target_w = w * job.scale
                target_h = h * job.scale
                upscaled_img = Image.fromarray(upscaled)
                upscaled_img = upscaled_img.resize(
                    (target_w, target_h), Image.LANCZOS
                )
                upscaled = np.array(upscaled_img)

            # Save upscaled frame
            out_frame_path = os.path.join(upscaled_dir, fname)
            Image.fromarray(upscaled).save(out_frame_path, "PNG")

            # Update progress
            job.frames_completed = idx + 1
            elapsed = time.time() - start_time
            job.current_fps = round(job.frames_completed / max(elapsed, 0.001), 2)
            remaining = job.frames_total - job.frames_completed
            job.eta_seconds = round(
                remaining / max(job.current_fps, 0.001), 1
            )

            # Update VRAM usage
            try:
                gpu_now = detect_gpu()
                job.vram_used_mb = gpu_now["vram_total_mb"] - gpu_now["vram_free_mb"]
            except Exception:
                pass

            _report()

        # ── 8. Encode output video ──
        job.status = JobStatus.ENCODING
        _report()

        if not job.output_path:
            base, ext = os.path.splitext(job.input_path)
            job.output_path = f"{base}_upscaled_{job.scale}x{ext}"

        encode_video(
            upscaled_dir,
            job.input_path,
            job.output_path,
            fps=video_info["fps"],
            use_nvenc=gpu["available"],
        )

        # ── 9. Verify output ──
        job.status = JobStatus.VERIFYING
        _report()

        verification = verify_output(
            job.output_path,
            expected_duration=video_info["duration_sec"],
        )

        if not verification["valid"]:
            raise RuntimeError(f"Output verification failed: {verification.get('error')}")

        logger.info("Verification passed: %s", verification)

        job.status = JobStatus.COMPLETE
        _report()
        return job

    except Exception as exc:
        logger.error("Upscale job failed: %s", exc, exc_info=True)
        job.status = JobStatus.FAILED
        job.error_message = str(exc)
        _report()
        return job

    finally:
        # Clean up temp directory
        if job._temp_dir and os.path.isdir(job._temp_dir):
            try:
                shutil.rmtree(job._temp_dir, ignore_errors=True)
                logger.info("Cleaned up temp dir: %s", job._temp_dir)
            except Exception:
                pass
