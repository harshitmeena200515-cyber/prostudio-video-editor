"""
End-to-end integration test for AI Video Upscaling.
Takes a real 3-second 720p video, runs the complete pipeline:
Probe -> Frame Extraction -> Tiled Inference on GPU -> Video Encoding with Audio -> Verification.
"""

import sys
import os
import time
from pathlib import Path

engine_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(engine_dir))

from pipeline.upscale_worker import UpscaleJob, JobStatus, run_upscale
from pipeline.ffmpeg_bridge import verify_output, probe_video


def test_upscale_pipeline():
    test_media = engine_dir / "test_media" / "test_720p_3s.mp4"
    assert test_media.is_file(), f"Test media not found at {test_media}"

    out_media = engine_dir / "test_media" / "test_720p_3s_upscaled_2x.mp4"
    if out_media.is_file():
        os.remove(out_media)

    job = UpscaleJob(
        input_path=str(test_media),
        output_path=str(out_media),
        model_name="realesr-animevideov3",
        scale=2,  # 720p (1280x720) -> 1440p (2560x1440)
        tile_size=256,
        overlap=32,
    )

    progress_events = []

    def on_progress(j: UpscaleJob):
        progress_events.append({
            "status": j.status.value,
            "frames": f"{j.frames_completed}/{j.frames_total}",
            "fps": j.current_fps,
            "eta": j.eta_seconds,
        })
        if j.status == JobStatus.PROCESSING and j.frames_completed % 10 == 0:
            print(f"Progress: {j.frames_completed}/{j.frames_total} frames | {j.current_fps} fps | ETA: {j.eta_seconds}s")

    t_start = time.time()
    result_job = run_upscale(job, on_progress)
    t_total = time.time() - t_start

    print(f"\nPipeline finished in {t_total:.2f} seconds.")
    print(f"Final status: {result_job.status}")
    if result_job.error_message:
        print(f"Error: {result_job.error_message}")

    assert result_job.status == JobStatus.COMPLETE, f"Job did not complete: {result_job.error_message}"
    assert os.path.isfile(str(out_media)), "Output file was not created"

    # Verify output properties
    verification = verify_output(str(out_media), expected_duration=3.0)
    print("\nVerification Result:")
    for k, v in verification.items():
        print(f"  {k}: {v}")

    assert verification["valid"] is True, f"Output invalid: {verification.get('error')}"
    assert verification["width"] == 2560, f"Expected 2560 width, got {verification['width']}"
    assert verification["height"] == 1440, f"Expected 1440 height, got {verification['height']}"
    assert verification["has_audio"] is True, "Audio was not preserved!"
    assert abs(verification["duration_sec"] - 3.0) < 0.5, f"Duration drift too high: {verification['duration_sec']}"

    print("\nSUCCESS! All checks passed for real AI video upscaling.")


if __name__ == "__main__":
    test_upscale_pipeline()
