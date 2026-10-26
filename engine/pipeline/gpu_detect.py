"""
ProStudio Engine — Runtime GPU Detection Module.

Detects NVIDIA GPUs via nvidia-smi at runtime.
NEVER hardcodes GPU model, VRAM, or driver version.
"""

import subprocess
import logging

logger = logging.getLogger(__name__)


def detect_gpu() -> dict:
    """
    Detect NVIDIA GPU capabilities at runtime using nvidia-smi.

    Returns a dict with keys:
        available (bool): Whether an NVIDIA GPU was detected.
        name (str): GPU name or "CPU Fallback".
        vram_total_mb (int): Total VRAM in MiB.
        vram_free_mb (int): Free VRAM in MiB.
        driver (str): Driver version string.
        provider (str): ONNX Runtime execution provider to use.
    """
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.total,memory.free,driver_version",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0 and result.stdout.strip():
            lines = result.stdout.strip().split("\n")
            # Use the first discrete GPU found
            parts = [p.strip() for p in lines[0].split(",")]
            if len(parts) >= 4:
                gpu_info = {
                    "available": True,
                    "name": parts[0],
                    "vram_total_mb": int(parts[1]),
                    "vram_free_mb": int(parts[2]),
                    "driver": parts[3],
                    "provider": "DmlExecutionProvider",
                }
                logger.info(
                    "GPU detected: %s (%d MiB total, %d MiB free)",
                    gpu_info["name"],
                    gpu_info["vram_total_mb"],
                    gpu_info["vram_free_mb"],
                )
                return gpu_info
    except FileNotFoundError:
        logger.warning("nvidia-smi not found — no NVIDIA GPU available")
    except subprocess.TimeoutExpired:
        logger.warning("nvidia-smi timed out")
    except Exception as exc:
        logger.warning("GPU detection error: %s", exc)

    return {
        "available": False,
        "name": "CPU Fallback",
        "vram_total_mb": 0,
        "vram_free_mb": 0,
        "driver": "N/A",
        "provider": "CPUExecutionProvider",
    }


def select_tile_size(vram_free_mb: int) -> int:
    """
    Select an appropriate tile size based on available VRAM.

    Uses conservative estimates to prevent OOM:
    - >= 3000 MiB free → 384px tiles
    - >= 1500 MiB free → 256px tiles
    - >= 800 MiB free  → 192px tiles
    - < 800 MiB free   → 128px tiles (safe minimum)
    """
    if vram_free_mb >= 3000:
        return 384
    elif vram_free_mb >= 1500:
        return 256
    elif vram_free_mb >= 800:
        return 192
    else:
        return 128


def get_safe_vram_ceiling_mb(vram_total_mb: int) -> int:
    """
    Calculate the safe VRAM ceiling (reserve ~45% for system/driver overhead).
    """
    return int(vram_total_mb * 0.45)
