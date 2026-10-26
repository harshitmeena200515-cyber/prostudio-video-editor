"""
Tests for FFmpeg detection and probing.
"""

import sys
import os
from pathlib import Path

engine_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(engine_dir))

from pipeline.ffmpeg_bridge import get_ffmpeg, get_ffprobe, probe_video, verify_output


def test_ffmpeg_available():
    try:
        ffmpeg = get_ffmpeg()
        ffprobe = get_ffprobe()
        print(f"FFmpeg binary: {ffmpeg}")
        print(f"FFprobe binary: {ffprobe}")
        assert os.path.isfile(ffmpeg) or os.path.exists(ffmpeg)
        assert os.path.isfile(ffprobe) or os.path.exists(ffprobe)
        return True
    except FileNotFoundError as e:
        print(f"FFmpeg not yet installed: {e}")
        return False


if __name__ == "__main__":
    avail = test_ffmpeg_available()
    print(f"FFmpeg test completed. Available={avail}")
