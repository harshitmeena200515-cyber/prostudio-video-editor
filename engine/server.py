"""
ProStudio AI Video Enhancement Engine — FastAPI Server.

Provides REST and WebSocket endpoints for the ProStudio web UI.
Runs on http://127.0.0.1:8765

Endpoints:
    GET  /health         → Engine status, GPU info, available models
    GET  /gpu            → Runtime GPU detection
    POST /jobs           → Submit an upscale job
    GET  /jobs/{id}      → Query job status
    DELETE /jobs/{id}    → Cancel a running job
    WS   /ws             → Real-time progress streaming
"""

import asyncio
import logging
import os
import sys
import json
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from pipeline.gpu_detect import detect_gpu, select_tile_size
from pipeline.ffmpeg_bridge import get_ffmpeg, get_ffprobe
from pipeline.upscale_worker import (
    UpscaleJob,
    JobStatus,
    run_upscale,
    list_available_models,
)

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("prostudio-engine")

# ── State ──
active_jobs: dict[str, UpscaleJob] = {}
ws_connections: set[WebSocket] = set()
executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="upscale")


# ── Lifecycle ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 ProStudio Engine starting on http://127.0.0.1:8765")
    gpu = detect_gpu()
    logger.info("GPU: %s | VRAM: %d MiB", gpu["name"], gpu["vram_total_mb"])
    yield
    executor.shutdown(wait=False, cancel_futures=True)
    logger.info("Engine shut down.")


# ── App ──
app = FastAPI(
    title="ProStudio AI Enhancement Engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Local development only
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Models ──
class SubmitJobRequest(BaseModel):
    input_path: str
    output_path: str | None = None
    model_name: str = "realesr-animevideov3"
    scale: int = 2
    tile_size: int = 0  # 0 = auto-detect
    overlap: int = 32


# ── WebSocket broadcast ──
async def broadcast_ws(message: dict):
    """Send a message to all connected WebSocket clients."""
    dead = set()
    payload = json.dumps(message)
    for ws in ws_connections:
        try:
            await ws.send_text(payload)
        except Exception:
            dead.add(ws)
    ws_connections.difference_update(dead)


def _sync_progress_callback(job: UpscaleJob):
    """
    Synchronous callback invoked by upscale_worker in the thread pool.
    Schedules an async broadcast to all WebSocket clients.
    """
    msg = {
        "type": f"job:{job.status.value}",
        "jobId": job.job_id,
        "status": job.status.value,
        "framesCompleted": job.frames_completed,
        "framesTotal": job.frames_total,
        "percent": round(
            (job.frames_completed / max(job.frames_total, 1)) * 100, 1
        ),
        "currentFps": job.current_fps,
        "etaSeconds": job.eta_seconds,
        "vramUsedMB": job.vram_used_mb,
    }

    if job.status == JobStatus.COMPLETE:
        msg["type"] = "job:complete"
        msg["outputPath"] = job.output_path
    elif job.status == JobStatus.FAILED:
        msg["type"] = "job:error"
        msg["error"] = job.error_message
        msg["recoverable"] = False
    elif job.status == JobStatus.CANCELLED:
        msg["type"] = "job:cancelled"

    # Schedule broadcast on the event loop
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.run_coroutine_threadsafe(broadcast_ws(msg), loop)
    except RuntimeError:
        pass


# ── REST Endpoints ──


@app.get("/health")
async def health():
    """Engine health check — consumed by enhancement-ui.js."""
    gpu = detect_gpu()
    try:
        ffmpeg_path = get_ffmpeg()
        ffmpeg_ok = True
    except FileNotFoundError:
        ffmpeg_path = None
        ffmpeg_ok = False

    models = list_available_models()
    models_ready = any(m["downloaded"] for m in models)

    return {
        "status": "ok",
        "engine": "ProStudio Neural Enhancement Engine v0.1.0",
        "gpu": gpu,
        "ffmpeg": {"available": ffmpeg_ok, "path": ffmpeg_path},
        "models": models,
        "models_ready": models_ready,
        "active_jobs": len([j for j in active_jobs.values() if j.status == JobStatus.PROCESSING]),
        "tile_size_auto": select_tile_size(gpu["vram_free_mb"]),
    }


@app.get("/gpu")
async def gpu_info():
    """Runtime GPU detection."""
    return detect_gpu()


@app.post("/jobs")
async def submit_job(req: SubmitJobRequest):
    """Submit an upscale enhancement job."""
    # Validate input file
    if not os.path.isfile(req.input_path):
        raise HTTPException(400, f"Input file not found: {req.input_path}")

    # Check FFmpeg
    try:
        get_ffmpeg()
    except FileNotFoundError as exc:
        raise HTTPException(503, str(exc))

    # Check models
    models = list_available_models()
    model_match = next((m for m in models if m["name"] == req.model_name), None)
    if model_match is None:
        raise HTTPException(400, f"Unknown model: {req.model_name}")
    if not model_match["downloaded"]:
        raise HTTPException(
            503,
            f"Model '{req.model_name}' not downloaded. "
            f"Place {req.model_name}.onnx in engine/models/",
        )

    # Create job
    job = UpscaleJob(
        input_path=req.input_path,
        output_path=req.output_path or "",
        model_name=req.model_name,
        scale=req.scale,
        tile_size=req.tile_size,
        overlap=req.overlap,
    )
    active_jobs[job.job_id] = job

    # Run in thread pool (non-blocking)
    loop = asyncio.get_event_loop()
    loop.run_in_executor(executor, run_upscale, job, _sync_progress_callback)

    logger.info("Job submitted: %s → %s (model=%s, scale=%dx)",
                job.job_id, job.input_path, job.model_name, job.scale)

    return {
        "jobId": job.job_id,
        "status": job.status.value,
        "message": "Job submitted successfully",
    }


@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Query job status."""
    job = active_jobs.get(job_id)
    if job is None:
        raise HTTPException(404, f"Job not found: {job_id}")

    return {
        "jobId": job.job_id,
        "status": job.status.value,
        "inputPath": job.input_path,
        "outputPath": job.output_path,
        "modelName": job.model_name,
        "scale": job.scale,
        "framesCompleted": job.frames_completed,
        "framesTotal": job.frames_total,
        "percent": round(
            (job.frames_completed / max(job.frames_total, 1)) * 100, 1
        ),
        "currentFps": job.current_fps,
        "etaSeconds": job.eta_seconds,
        "vramUsedMB": job.vram_used_mb,
        "error": job.error_message or None,
    }


@app.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a running job."""
    job = active_jobs.get(job_id)
    if job is None:
        raise HTTPException(404, f"Job not found: {job_id}")

    if job.status in (JobStatus.COMPLETE, JobStatus.FAILED, JobStatus.CANCELLED):
        return {"jobId": job_id, "status": job.status.value, "message": "Job already finished"}

    job.cancel()
    logger.info("Job cancelled: %s", job_id)
    return {"jobId": job_id, "status": "cancelled", "message": "Cancellation requested"}


# ── WebSocket ──


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Real-time progress streaming via WebSocket."""
    await ws.accept()
    ws_connections.add(ws)
    logger.info("WebSocket client connected (%d total)", len(ws_connections))

    try:
        while True:
            # Listen for client messages (e.g. cancel commands)
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "job:cancel":
                    job_id = msg.get("jobId")
                    job = active_jobs.get(job_id)
                    if job:
                        job.cancel()
                        await ws.send_text(json.dumps({
                            "type": "job:cancelled",
                            "jobId": job_id,
                        }))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        ws_connections.discard(ws)
        logger.info("WebSocket client disconnected (%d remaining)", len(ws_connections))


# ── Entry point ──


def main():
    """Start the engine server."""
    import uvicorn

    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=8765,
        log_level="info",
        reload=False,
    )


if __name__ == "__main__":
    main()
