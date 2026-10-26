# ProStudio Video Editor — AI Enhancement Migration & Implementation Plan

## 1. Principles & Safety Rules

1. **Non-Destructive Evolution:** The existing ProStudio project architecture, styling, and working features will be preserved and extended, not replaced.
2. **Phase Gates & Approvals:** Each phase must pass automated and manual verification before advancing. No source code modifications will begin without explicit user authorization.
3. **Hardware-Aware Design:** Every neural pipeline is tailored for the local **NVIDIA GeForce RTX 3050 Laptop GPU (4 GB VRAM)** with dynamic tiling to prevent Out-Of-Memory (OOM) failures, coupled with CPU fallback.

---

## 2. Phase-by-Phase Implementation Roadmap

```
+---------------------------------------------------------------------------------------------------+
|                               PHASED IMPLEMENTATION TIMELINE                                      |
+---------------------------------------------------------------------------------------------------+
|  PHASE 0: Baseline Stabilization & Bug Fixes                                                      |
|           Fix missing `effects/index.js`, establish error handling, verify clean launch.          |
+---------------------------------------------------------------------------------------------------+
                                            │
                                            ▼
+---------------------------------------------------------------------------------------------------+
|  PHASE 1: AI Enhancement Studio UI Integration                                                    |
|           Add AI Enhancement mode, Split-Screen Before/After slider, parameters & batch queue.    |
+---------------------------------------------------------------------------------------------------+
                                            │
                                            ▼
+---------------------------------------------------------------------------------------------------+
|  PHASE 2: Standalone Native AI Enhancement Engine (Sidecar)                                       |
|           Build FFmpeg demux/encode pipeline + ONNX Runtime tiled inference (Real-ESRGAN, RIFE).  |
+---------------------------------------------------------------------------------------------------+
                                            │
                                            ▼
+---------------------------------------------------------------------------------------------------+
|  PHASE 3: Bi-Directional IPC Communication Bridge                                                 |
|           WebSocket / REST bridge connecting web UI to native engine for progress, ETA, telemetry.|
+---------------------------------------------------------------------------------------------------+
                                            │
                                            ▼
+---------------------------------------------------------------------------------------------------+
|  PHASE 4: Windows Desktop Application Packaging                                                   |
|           Bundle ProStudio frontend, engine sidecar, and FFmpeg via Tauri v2 into Windows `.exe`.  |
+---------------------------------------------------------------------------------------------------+
```

---

### Phase 0: Baseline Stabilization & Bug Fixes
* **Objectives:**
  1. Fix the startup crash caused by the missing [`js/effects/index.js`](file:///c:/Users/Harshit%20Meena/Downloads/prostudio-video-editor/js/ui/library-renderer.js#L6).
  2. Create a clean module export bridge uniting [`video-effects.js`](file:///c:/Users/Harshit%20Meena/Downloads/prostudio-video-editor/js/effects/video-effects.js), [`filters.js`](file:///c:/Users/Harshit%20Meena/Downloads/prostudio-video-editor/js/effects/filters.js), and [`transitions.js`](file:///c:/Users/Harshit%20Meena/Downloads/prostudio-video-editor/js/effects/transitions.js).
  3. Verify that the web application loads cleanly in modern Chromium browsers without console exceptions.
* **Verification Gate:**
  * Start local HTTP server (`python -m http.server 8080` or Node static server).
  * Open browser console: zero 404 network errors or uncaught import errors.

---

### Phase 1: AI Enhancement Studio UI Integration
* **Objectives:**
  1. **Workspace Mode Switcher:** Add "AI Enhance Studio" mode toggle in top navigation bar alongside existing Video and Photo modes.
  2. **Split-Screen Before / After Comparison:**
     * Integrate an interactive draggable curtain/wipe slider on the preview canvas allowing pixel-level comparison between original footage and enhanced output.
     * Support horizontal wipe, vertical wipe, and side-by-side view modes.
3. **Enhancement Inspector Panel:**
     * *Super-Resolution:* 1x (Enhance only), 2x, 4x, 8x upscale factor.
     * *Model Flavor:* General Real-ESRGAN, Animation / Clean Line, Fast Compact.
     * *Frame Interpolation:* Original FPS $\to$ 60 FPS, 120 FPS, or Slow-Mo ($2\times, 4\times, 8\times, 16\times$).
     * *Deblur & Sharpen:* NAFNet motion deblur intensity slider ($0\text{–}100$) and AMD FidelityFX CAS sharpening ($0.0\text{–}1.0$).
     * *Denoise & Deblock:* FastDVDnet temporal denoise strength.
     * *Stabilization:* FFmpeg `vid.stab` presets (Gentle handheld smoothing vs. Lock tripod simulation).
     * *Hardware Profile:* Auto / NVIDIA RTX 3050 (CUDA FP16) / Intel Iris Xe (DirectML) / CPU.
     * *Low VRAM Safe Mode:* Enforces 256px tile processing to guarantee $< 1.8\text{ GB}$ peak VRAM.
  4. **Batch Processing & Telemetry Queue:**
     * Multi-item job queue panel showing thumbnail, model preset, progress bar, current FPS, ETA countdown, and live VRAM gauge.
* **Verification Gate:**
  * UI renders interactively; all sliders, presets, and queue items update project state without layout breaking.

---

### Phase 2: Standalone Native AI Enhancement Engine (Sidecar)
* **Objectives:**
  1. **Directory Structure:** Create `engine/` containing the standalone processing service.
  2. **FFmpeg Pipeline Orchestrator:**
     * Hardware-accelerated frame extraction via NVDEC: `ffmpeg -hwaccel cuda -i input.mp4 -f image2pipe ...`
     * Two-pass video stabilization worker using `libvidstab`.
     * Hardware-accelerated remuxing via NVENC: `ffmpeg -f image2pipe ... -c:v h264_nvenc -b:v 20M output.mp4`.
  3. **Tiled Neural Inference Pipeline (ONNX Runtime / PyTorch):**
     * **Real-ESRGAN Compact & x4plus:** Super-resolution worker with automatic spatial tile splitting ($256 \times 256$ or $384 \times 384$ px), 32px boundary overlap, and linear feather blending to eliminate grid artifacts.
     * **IFRNet / RIFE:** Frame synthesis worker inserting intermediate frames for high-FPS conversion and slow-mo.
     * **NAFNet:** Single-frame / multi-frame motion deblur worker.
     * **AMD FidelityFX CAS:** Ultra-fast compute sharpening pass.
  4. **Device Execution Manager:**
     * Priority: `CUDAExecutionProvider` (RTX 3050) $\to$ `DmlExecutionProvider` (DirectML on Intel Iris Xe) $\to$ `CPUExecutionProvider` (AVX2).
* **Verification Gate:**
  * Run test script processing a sample 5-second 1080p video clip.
  * Verify 2x upscale, 60fps interpolation, and stabilization execute without errors and peak VRAM stays below 2.0 GB.

---

### Phase 3: Bi-Directional IPC Communication Bridge
* **Objectives:**
  1. Implement a lightweight local WebSocket and REST server inside `engine/` (FastAPI / `websockets`).
  2. Create `js/ai/ai-engine-client.js` in the front-end to connect to `ws://127.0.0.1:8765`.
  3. Stream live frame previews back to the front-end for the Split-Screen Comparison slider.
  4. Emit live job status updates: `job:progress` (percentage), `job:fps`, `job:eta`, `job:vram`, `job:complete`.
  5. Support full control: Start, Pause, Resume, and Cancel enhancement jobs from the UI.
* **Verification Gate:**
  * Submitting a video through the ProStudio UI triggers native processing in the sidecar engine; live progress and telemetry appear in real time on the UI.

---

### Phase 4: Windows Desktop Application Packaging
* **Objectives:**
  1. Initialize **Tauri v2** configuration (`src-tauri/`) wrapping the web editor in the native Windows Microsoft Edge WebView2 runtime.
  2. Bundle the compiled engine sidecar binary and FFmpeg executable within the Tauri application bundle.
  3. Configure auto-start of the sidecar process on application launch and graceful shutdown on exit.
  4. Generate a single-click standalone Windows installer (`.exe` / `.msi`) using NSIS.
* **Verification Gate:**
  * Execute installer on a clean Windows machine; launch ProStudio from desktop shortcut; perform end-to-end 4K AI upscale and export without external prerequisites.

---

## 3. Risk Assessment & Mitigation Matrix

| Risk / Failure Mode | Likelihood | Impact | Preventive Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **CUDA Out of Memory (OOM) on RTX 3050 (4 GB)** | High | Critical | Enforce dynamic tile-based splitting ($256 \times 256$ px, 32px pad) and FP16 precision. Caps VRAM at $< 1.8\text{ GB}$. |
| **GPL License Contamination from FFmpeg / `vid.stab`** | Medium | High | Enforce strict CLI subprocess isolation. ProStudio code never links against GPL C headers. |
| **Large Desktop Installer Size (Model Weights)** | High | Medium | Ship lightweight Compact models (~15 MB) by default; provide on-demand background downloader for heavy 4x models. |
| **Hardware Driver Incompatibility** | Low | Medium | Automatic 3-tier fallback hierarchy: NVIDIA CUDA $\to$ DirectML (Intel Iris Xe) $\to$ Multi-threaded CPU (AVX2). |
| **Inter-frame Temporal Flickering in Upscaling** | Medium | Medium | Use `realesr-animevideov3` compact architecture specifically optimized for temporal consistency across consecutive video frames. |

---

## 4. Rollback & Checkpoint Strategy

* All migrations will be organized into isolated git feature branches:
  * `feature/phase0-bugfixes`
  * `feature/phase1-ai-enhancement-ui`
  * `feature/phase2-native-ai-engine`
  * `feature/phase3-ipc-bridge`
  * `feature/phase4-windows-packaging`
* Each branch will be tagged with a semantic checkpoint (e.g. `checkpoint-phase0`, `checkpoint-phase1`).
* `main` will remain untouched and stable until all integration tests pass with explicit user approval.
