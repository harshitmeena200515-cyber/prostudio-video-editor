# ProStudio AI Video Enhancement Engine

Standalone local neural processing engine for ProStudio Video Editor. Provides hardware-accelerated video super-resolution, tiled inference, and FFmpeg decode/encode pipelines.

---

## Features

- **Tiled Neural Inference:** Automatic spatial tile splitting ($256\times 256$ or $384\times 384$ px) with boundary overlap and linear feather blending to prevent seam artifacts while staying within 4 GB VRAM limits (RTX 3050 Laptop).
- **DirectML & CUDA Acceleration:** Native Windows DirectX 12 GPU acceleration via `onnxruntime-directml` and CUDA fallback with automatic multi-threaded CPU fallback.
- **FFmpeg Subprocess Isolation:** Hardware-accelerated video demuxing/remuxing with full audio passthrough and container verification (LGPL/GPL license-compliant subprocess isolation).
- **FastAPI & WebSocket Server:** Runs on `http://127.0.0.1:8765` with `/health` telemetry, `/jobs` submission, and real-time progress/VRAM/FPS streaming over `/ws`.

---

## Directory Structure

```
engine/
├── bin/                 # Local FFmpeg & FFprobe executables (gitignored)
├── models/              # Downloaded ONNX model weights (gitignored)
├── pipeline/
│   ├── gpu_detect.py    # Runtime GPU & VRAM telemetry detection
│   ├── ffmpeg_bridge.py # Video decode, encode, and verification bridge
│   ├── tiled_inference.py # Tiling, feather masking, and reassembly
│   └── upscale_worker.py  # Real-ESRGAN inference pipeline orchestrator
├── tests/
│   ├── test_gpu_detect.py
│   ├── test_tiled_inference.py
│   ├── test_ffmpeg_bridge.py
│   └── test_end_to_end.py
├── test_media/          # Sample video files (gitignored)
├── pyproject.toml       # Python dependencies configuration
└── server.py            # FastAPI entry point
```

---

## Quickstart

### 1. Environment Setup
Install dependencies using [uv](https://docs.astral.sh/uv/):
```powershell
cd engine
uv venv
uv pip install fastapi "uvicorn[standard]" onnxruntime-directml numpy Pillow websockets
```

### 2. Download Model Weights
Place `realesr-animevideov3.onnx` into `engine/models/`:
```powershell
curl.exe -L "https://huggingface.co/tidus2102/Real-ESRGAN/resolve/main/RealESR-AnimeVideo-v3_x4.onnx" -o "engine/models/realesr-animevideov3.onnx"
```

### 3. Start Engine Service
```powershell
.venv\Scripts\python.exe server.py
```
The server will bind to `http://127.0.0.1:8765`. Opening ProStudio in the browser will immediately detect the engine and switch to **Engine: Online (Active)**.

---

## Running Verification Tests

```powershell
# Unit tests
.venv\Scripts\python.exe tests/test_gpu_detect.py
.venv\Scripts\python.exe tests/test_tiled_inference.py
.venv\Scripts\python.exe tests/test_ffmpeg_bridge.py

# Full end-to-end real video upscaling test (720p -> 1440p)
.venv\Scripts\python.exe tests/test_end_to_end.py
```
