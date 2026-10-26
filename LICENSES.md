# ProStudio Video Editor — Licenses & Redistribution Compliance Ledger

## 1. Compliance Statement & Intellectual Property Protection

This project independently implements AI video enhancement workflows comparable to commercial products such as Topaz Video AI. To ensure absolute legal and intellectual property compliance:

1. **Clean-Room Implementation:** No proprietary source code, reverse-engineered binaries, encrypted weight archives, or closed shaders from Topaz Labs or any commercial product are copied, decompiled, bypassed, or integrated.
2. **Open-Source Foundations:** All neural network architectures, model weights, computer vision libraries, and media codecs utilized in ProStudio originate exclusively from verified public open-source projects.
3. **Licensing Isolation:** Strict boundaries (CLI subprocesses and decoupled network IPC) are enforced to isolate copyleft (GPL) components from permissive (MIT/BSD/Apache) codebases.

---

## 2. Model & Weights Licensing Matrix

| Component / Model | Primary Repository | Code License | Pretrained Weights License | Commercial Redistribution Policy | ProStudio Implementation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Real-ESRGAN** | `xinntao/Real-ESRGAN` | **BSD 3-Clause** | **BSD 3-Clause** | **Permitted** (With attribution) | Direct bundling of `RealESRGAN_x4plus` and `realesr-animevideov3` ONNX models. |
| **NAFNet** | `Megvii-BaseDetection/NAFNet` | **MIT** | **MIT / Open Access** | **Permitted** | Exported to ONNX runtime format for motion deblurring. |
| **AMD FidelityFX CAS** | `GPUOpen-Effects/FidelityFX-CAS`| **MIT** | N/A (Algorithmic) | **Permitted** | Integrated directly into shader/post-processing pipeline. |
| **IFRNet** | `lyh-18/IFRNet` | **Apache 2.0** | **Apache 2.0 / Permissive** | **Permitted** | **Default Bundled Model** for high-FPS frame interpolation and slow-motion. |
| **RIFE v4.6 / v4.26** | `hzwer/Practical-RIFE` | **MIT** | ⚠️ **Research / Non-Commercial** (varies by checkpoint) | ⚠️ **Restricted** (Some checkpoints carry CC-BY-NC clauses) | **Optional Download / User-Loaded Model**: RIFE inference engine supported; users may install or download checkpoints locally without commercial bundling risk. |
| **FastDVDnet** | `m-tassano/fastdvdnet` | **BSD 3-Clause** | **BSD 3-Clause** | **Permitted** | Multi-frame temporal video denoising model. |
| **BasicVSR++** | `open-mmlab/mmediting` | **Apache 2.0** | **Apache 2.0** | **Permitted** | Optional high-fidelity video restoration model. |
| **GFPGAN** | `TencentARC/GFPGAN` | **Apache 2.0** | **Apache 2.0** | **Permitted** | **Default Face Restoration Model** (Permissive for commercial and open redistribution). |
| **CodeFormer** | `sczhou/CodeFormer` | **S-Lab License (Non-Commercial)** | ⚠️ **Non-Commercial Research** | ⚠️ **Restricted** | Excluded from default distribution. Kept as an optional user-selected plugin. |

---

## 3. Media Runtimes & Codec Compliance (FFmpeg & GPL Isolation)

### FFmpeg Architecture & Licensing Breakdown
ProStudio relies on **FFmpeg** for high-performance hardware demuxing (NVDEC), two-pass video stabilization (`vid.stab`), and hardware encoding (NVENC / ProRes).

* **Core FFmpeg:** Licensed under **LGPL v2.1+**.
* **Optional Modules:** When FFmpeg is compiled with `libx264`, `libx265`, or `vid.stab`, the resulting binary is governed by the **GNU General Public License (GPL) v2+**.

### The Subprocess Isolation Strategy
Under the Free Software Foundation (FSF) and legal precedents, calling an external GPL executable as a separate process via standard operating system commands, standard input/output (stdio), or pipes does **not** create a derivative work.

```
+------------------------------------+
|    ProStudio App & Engine (MIT)    |
|   (Permissive / Proprietary)       |
+------------------------------------+
                  |
     Command Line Execution / IPC
     (stdin / stdout / file pipes)
                  |
                  v
+------------------------------------+
|     FFmpeg GPL v2+ CLI Binary      |
|    (External standalone binary)    |
+------------------------------------+
```

1. **No Static or Dynamic C-Linking:** ProStudio's source code does not compile against or link directly (`#include <libavcodec/avcodec.h>`) to GPL static/dynamic libraries.
2. **Subprocess Boundary:** All FFmpeg invocations occur through discrete CLI subprocess calls (`spawn('ffmpeg.exe', [...args])`).
3. **Distribution Rules:** When distributing FFmpeg binaries with the Windows application:
   * FFmpeg's license text and build configuration (`ffmpeg -version` details) must be included in the `LICENSES/` folder.
   * A link or script to retrieve the exact FFmpeg source code used to compile the binary must be provided in documentation.

---

## 4. Software Frameworks & Desktop Runtimes

| Framework / Tool | Source / Organization | License | Redistribution Notes |
| :--- | :--- | :--- | :--- |
| **ONNX Runtime** | Microsoft Corporation | **MIT** | Permissive. Supports DirectML, CUDA, TensorRT, and CPU execution providers. |
| **PyTorch / TorchVision** | PyTorch Foundation / Meta | **Modified BSD** | Permissive. Binary redistributable with license attribution. |
| **Tauri v2** | Tauri Programme / Commons Conservancy | **MIT / Apache 2.0** | Permissive. Minimal footprint Windows desktop packaging using native Microsoft Edge WebView2. |
| **Node.js** | OpenJS Foundation | **MIT** | Build-time and tooling runtime. |
| **Google Gemini API** | Google LLC | **Terms of Service** | Hosted cloud API. Used exclusively for generative scriptwriting and caption generation; requires user-supplied API key. No model weights bundled. |

---

## 5. Third-Party License Attribution Notices

### BSD 3-Clause License (Real-ESRGAN)
```text
Copyright (c) 2021, Xintao Wang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
```

### MIT License (NAFNet / FidelityFX CAS / Tauri / ONNX Runtime)
```text
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
```

### Apache License 2.0 (IFRNet / GFPGAN)
```text
Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at:
    http://www.apache.org/licenses/LICENSE-2.0
```
