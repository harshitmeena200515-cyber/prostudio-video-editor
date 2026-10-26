"""
ProStudio Engine — FFmpeg Subprocess Bridge.

Handles video decoding (frame extraction) and encoding (frame reassembly)
via FFmpeg as an external subprocess. GPL isolation is maintained — we
never link against FFmpeg libraries.
"""

import subprocess
import json
import os
import logging
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)

# FFmpeg binary resolution order:
# 1. engine/bin/ffmpeg.exe (bundled)
# 2. System PATH
_ENGINE_DIR = Path(__file__).resolve().parent.parent
_BUNDLED_FFMPEG = _ENGINE_DIR / "bin" / "ffmpeg.exe"
_BUNDLED_FFPROBE = _ENGINE_DIR / "bin" / "ffprobe.exe"


def _find_binary(name: str, bundled_path: Path) -> str | None:
    """Locate an FFmpeg binary, preferring bundled over system PATH."""
    if bundled_path.is_file():
        return str(bundled_path)
    found = shutil.which(name)
    return found


def get_ffmpeg() -> str:
    """Return the path to ffmpeg, or raise if not found."""
    path = _find_binary("ffmpeg", _BUNDLED_FFMPEG)
    if path is None:
        raise FileNotFoundError(
            "FFmpeg not found. Place ffmpeg.exe in engine/bin/ or install it on PATH."
        )
    return path


def get_ffprobe() -> str:
    """Return the path to ffprobe, or raise if not found."""
    path = _find_binary("ffprobe", _BUNDLED_FFPROBE)
    if path is None:
        raise FileNotFoundError(
            "ffprobe not found. Place ffprobe.exe in engine/bin/ or install it on PATH."
        )
    return path


def probe_video(input_path: str) -> dict:
    """
    Probe a video file and return metadata.

    Returns dict with keys:
        width, height, fps (float), duration_sec (float),
        total_frames (int), has_audio (bool), codec, pix_fmt
    """
    ffprobe = get_ffprobe()
    cmd = [
        ffprobe,
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        input_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {result.stderr}")

    data = json.loads(result.stdout)
    video_stream = None
    has_audio = False

    for stream in data.get("streams", []):
        if stream["codec_type"] == "video" and video_stream is None:
            video_stream = stream
        elif stream["codec_type"] == "audio":
            has_audio = True

    if video_stream is None:
        raise ValueError(f"No video stream found in {input_path}")

    # Parse FPS from r_frame_rate (e.g. "30/1" or "30000/1001")
    fps_parts = video_stream.get("r_frame_rate", "30/1").split("/")
    fps = float(fps_parts[0]) / float(fps_parts[1]) if len(fps_parts) == 2 else 30.0

    # Duration: prefer stream duration, then format duration
    duration = float(
        video_stream.get("duration")
        or data.get("format", {}).get("duration", "0")
    )

    # Total frames: prefer nb_frames, else compute from duration
    nb_frames = video_stream.get("nb_frames")
    if nb_frames and nb_frames != "N/A":
        total_frames = int(nb_frames)
    else:
        total_frames = max(1, round(duration * fps))

    info = {
        "width": int(video_stream["width"]),
        "height": int(video_stream["height"]),
        "fps": round(fps, 4),
        "duration_sec": round(duration, 4),
        "total_frames": total_frames,
        "has_audio": has_audio,
        "codec": video_stream.get("codec_name", "unknown"),
        "pix_fmt": video_stream.get("pix_fmt", "unknown"),
    }
    logger.info("Probed video: %s", info)
    return info


def extract_frames(
    input_path: str,
    output_dir: str,
    *,
    use_hwaccel: bool = True,
    on_progress=None,
) -> int:
    """
    Extract all frames from a video to numbered PNG files.

    Args:
        input_path: Path to the input video.
        output_dir: Directory to write frame_%06d.png files.
        use_hwaccel: Attempt NVDEC hardware acceleration.
        on_progress: Optional callback(frame_number: int).

    Returns:
        Total number of extracted frames.
    """
    ffmpeg = get_ffmpeg()
    os.makedirs(output_dir, exist_ok=True)

    cmd = [ffmpeg, "-y"]
    if use_hwaccel:
        cmd.extend(["-hwaccel", "cuda"])
    cmd.extend([
        "-i", input_path,
        "-fps_mode", "passthrough",
        "-f", "image2",
        os.path.join(output_dir, "frame_%06d.png"),
    ])

    logger.info("Extracting frames: %s", " ".join(cmd))

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    # FFmpeg writes progress to stderr
    _, stderr = proc.communicate()

    if proc.returncode != 0:
        # Retry without hwaccel if NVDEC fails
        if use_hwaccel and ("hwaccel" in stderr.lower() or "cuda" in stderr.lower()):
            logger.warning("NVDEC hwaccel failed, retrying with CPU decode")
            return extract_frames(
                input_path, output_dir, use_hwaccel=False, on_progress=on_progress
            )
        raise RuntimeError(f"FFmpeg frame extraction failed (code {proc.returncode}): {stderr[-500:]}")

    # Count extracted frames
    frame_count = len([
        f for f in os.listdir(output_dir)
        if f.startswith("frame_") and f.endswith(".png")
    ])
    logger.info("Extracted %d frames to %s", frame_count, output_dir)
    return frame_count


def encode_video(
    frames_dir: str,
    input_video: str,
    output_path: str,
    *,
    fps: float,
    use_nvenc: bool = True,
    cq: int = 18,
) -> str:
    """
    Encode upscaled frames back into a video file with audio from the original.

    Args:
        frames_dir: Directory containing frame_%06d.png files.
        input_video: Original video (for audio stream extraction).
        output_path: Path for the output video file.
        fps: Frame rate for the output.
        use_nvenc: Attempt NVENC hardware encoding.
        cq: Constant quality parameter (lower = higher quality).

    Returns:
        Path to the output video file.
    """
    ffmpeg = get_ffmpeg()
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    # Probe original for audio
    try:
        info = probe_video(input_video)
        has_audio = info["has_audio"]
    except Exception:
        has_audio = False

    cmd = [ffmpeg, "-y"]

    # Input 1: upscaled frames
    cmd.extend([
        "-framerate", str(fps),
        "-i", os.path.join(frames_dir, "frame_%06d.png"),
    ])

    # Input 2: original video (for audio)
    if has_audio:
        cmd.extend(["-i", input_video])

    # Map streams
    cmd.extend(["-map", "0:v"])
    if has_audio:
        cmd.extend(["-map", "1:a"])

    # Video encoder
    if use_nvenc:
        cmd.extend([
            "-c:v", "h264_nvenc",
            "-preset", "p4",
            "-cq", str(cq),
            "-pix_fmt", "yuv420p",
        ])
    else:
        cmd.extend([
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", str(cq),
            "-pix_fmt", "yuv420p",
        ])

    # Audio: copy without re-encoding
    if has_audio:
        cmd.extend(["-c:a", "copy"])

    cmd.append(output_path)

    logger.info("Encoding video: %s", " ".join(cmd))

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

    if result.returncode != 0:
        # Retry with CPU encoder if NVENC fails
        if use_nvenc and "nvenc" in result.stderr.lower():
            logger.warning("NVENC failed, retrying with libx264")
            return encode_video(
                frames_dir, input_video, output_path,
                fps=fps, use_nvenc=False, cq=cq,
            )
        raise RuntimeError(f"FFmpeg encoding failed (code {result.returncode}): {result.stderr[-500:]}")

    logger.info("Encoded video: %s", output_path)
    return output_path


def verify_output(output_path: str, expected_duration: float | None = None) -> dict:
    """
    Verify an output video file is valid and playable.

    Returns verification results dict.
    """
    if not os.path.isfile(output_path):
        return {"valid": False, "error": "Output file does not exist"}

    file_size = os.path.getsize(output_path)
    if file_size < 1024:
        return {"valid": False, "error": f"Output file too small ({file_size} bytes)"}

    try:
        info = probe_video(output_path)
    except Exception as exc:
        return {"valid": False, "error": f"Cannot probe output: {exc}"}

    result = {
        "valid": True,
        "file_size_bytes": file_size,
        "width": info["width"],
        "height": info["height"],
        "fps": info["fps"],
        "duration_sec": info["duration_sec"],
        "total_frames": info["total_frames"],
        "has_audio": info["has_audio"],
        "codec": info["codec"],
    }

    if expected_duration is not None:
        drift = abs(info["duration_sec"] - expected_duration)
        result["duration_drift_sec"] = round(drift, 3)
        if drift > 0.5:
            result["warning"] = f"Duration drift {drift:.3f}s exceeds 0.5s threshold"

    return result
