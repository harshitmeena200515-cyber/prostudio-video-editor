"""
Tests for GPU detection and tile size calculation.
"""

import sys
from pathlib import Path

# Add engine to path
engine_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(engine_dir))

from pipeline.gpu_detect import detect_gpu, select_tile_size, get_safe_vram_ceiling_mb


def test_gpu_detection():
    gpu = detect_gpu()
    assert isinstance(gpu, dict)
    assert "available" in gpu
    assert "name" in gpu
    assert "vram_total_mb" in gpu
    assert "vram_free_mb" in gpu
    assert "provider" in gpu
    print(f"Detected GPU: {gpu}")


def test_select_tile_size():
    assert select_tile_size(3500) == 384
    assert select_tile_size(2000) == 256
    assert select_tile_size(1000) == 192
    assert select_tile_size(500) == 128


def test_safe_vram_ceiling():
    ceiling = get_safe_vram_ceiling_mb(4096)
    assert ceiling == 1843
    print(f"Safe VRAM ceiling for 4096MB: {ceiling}MB")


if __name__ == "__main__":
    test_gpu_detection()
    test_select_tile_size()
    test_safe_vram_ceiling()
    print("All GPU tests passed!")
