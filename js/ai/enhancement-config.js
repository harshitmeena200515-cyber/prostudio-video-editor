/**
 * ProStudio AI Video Enhancement Configuration & Model Registry
 * Defines parameter schemas, hardware profiles, model metadata, and operational status.
 */

export const EnhancementStatus = {
    UI_CONFIGURED: 'UI Configured & Ready',
    ALGORITHMIC_READY: 'Algorithmic Preview Ready',
    SIDECAR_REQUIRED: 'Requires Local Engine Service',
    PLANNED: 'Planned for Phase 2 Engine'
};

export const HardwareProfiles = {
    RTX3050_LAPTOP: {
        id: 'rtx3050_4gb',
        name: 'NVIDIA GeForce RTX 3050 Laptop GPU',
        vramTotalMB: 4096,
        vramSafeCeilingMB: 1840,
        defaultTileSize: 256,
        supportedTileSizes: [192, 256, 384],
        preferredPrecision: 'FP16',
        preferredProvider: 'CUDAExecutionProvider'
    },
    INTEL_IRIS_XE: {
        id: 'intel_iris_xe',
        name: 'Intel(R) Iris(R) Xe Graphics',
        vramTotalMB: 2048,
        vramSafeCeilingMB: 1024,
        defaultTileSize: 192,
        supportedTileSizes: [128, 192, 256],
        preferredPrecision: 'FP16',
        preferredProvider: 'DmlExecutionProvider'
    },
    CPU_FALLBACK: {
        id: 'cpu_avx2',
        name: 'Multi-Core CPU (AVX2 / OpenVINO)',
        vramTotalMB: 0,
        vramSafeCeilingMB: 0,
        defaultTileSize: 128,
        supportedTileSizes: [64, 128, 192],
        preferredPrecision: 'FP32',
        preferredProvider: 'CPUExecutionProvider'
    }
};

export const FeatureCardsConfig = [
    {
        id: 'upscale',
        title: 'AI Video Upscaling',
        tagline: 'Super-Resolution with artifact removal',
        badge: 'Sidecar Engine Required',
        badgeType: 'warning',
        status: EnhancementStatus.SIDECAR_REQUIRED,
        statusNote: 'UI and parameter builder are active. Native inference requires local sidecar engine.',
        model: 'Real-ESRGAN Compact / Standard',
        license: 'BSD 3-Clause (Permissive)',
        iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7M3 9V3h6M21 15v6h-6"/></svg>`,
        parameters: {
            scale: {
                label: 'Upscale Factor',
                type: 'select',
                options: [
                    { value: '2x', label: '2x (1080p -> 4K UHD)' },
                    { value: '4x', label: '4x (SD 480p -> 4K UHD)' },
                    { value: 'custom', label: 'Custom Resolution' }
                ],
                default: '2x'
            },
            modelType: {
                label: 'Model Architecture',
                type: 'select',
                options: [
                    { value: 'realesr-animevideov3', label: 'RealESRGAN AnimeVideo-v3 (Temporal Compact)' },
                    { value: 'realesr-general-x4v3', label: 'RealESRGAN General x4v3 (Natural Video)' },
                    { value: 'realesrgan-x4plus', label: 'RealESRGAN x4plus (Maximum Detail)' }
                ],
                default: 'realesr-animevideov3'
            },
            tileSize: {
                label: 'VRAM Tile Boundary',
                type: 'select',
                options: [
                    { value: '256', label: '256 x 256 px (Safe for 4GB RTX 3050)' },
                    { value: '384', label: '384 x 384 px (Balanced)' },
                    { value: '512', label: '512 x 512 px (High VRAM)' }
                ],
                default: '256'
            },
            denoiseBlend: {
                label: 'Pre-Denoise Strength',
                type: 'range',
                min: 0,
                max: 100,
                step: 1,
                default: 25,
                unit: '%'
            }
        }
    },
    {
        id: 'denoise',
        title: 'AI Video Denoise',
        tagline: 'Multi-frame temporal grain & compression suppression',
        badge: 'Sidecar Engine Required',
        badgeType: 'warning',
        status: EnhancementStatus.SIDECAR_REQUIRED,
        statusNote: 'Configures temporal filtering parameters. Execution handled by native sidecar.',
        model: 'FastDVDnet / BasicVSR++',
        license: 'BSD 3-Clause / Apache 2.0',
        iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2.5-4 5.5-4 8 0s5.5 4 8 0 5.5-4 8 0M2 6c2.5-4 5.5-4 8 0s5.5 4 8 0 5.5-4 8 0M2 18c2.5-4 5.5-4 8 0s5.5 4 8 0 5.5-4 8 0"/></svg>`,
        parameters: {
            temporalWindow: {
                label: 'Temporal Frame Window',
                type: 'select',
                options: [
                    { value: '3', label: '3 Frames (Fast)' },
                    { value: '5', label: '5 Frames (High Accuracy)' }
                ],
                default: '5'
            },
            denoiseLevel: {
                label: 'Noise Reduction Amount',
                type: 'range',
                min: 0,
                max: 100,
                step: 1,
                default: 40,
                unit: '%'
            },
            preserveGrain: {
                label: 'Preserve Film Texture',
                type: 'toggle',
                default: true
            }
        }
    },
    {
        id: 'sharpen',
        title: 'AI Deblur & Sharpen',
        tagline: 'Motion deblurring & contrast-adaptive edge restoration',
        badge: 'Algorithmic Preview Ready',
        badgeType: 'success',
        status: EnhancementStatus.ALGORITHMIC_READY,
        statusNote: 'AMD CAS sharpening preview is active on canvas. NAFNet deblur requires sidecar.',
        model: 'NAFNet + AMD FidelityFX CAS',
        license: 'MIT License (Permissive)',
        iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
        parameters: {
            casSharpen: {
                label: 'AMD FidelityFX CAS Sharpen',
                type: 'range',
                min: 0,
                max: 100,
                step: 1,
                default: 65,
                unit: '%'
            },
            deblurStrength: {
                label: 'NAFNet Motion Deblur',
                type: 'range',
                min: 0,
                max: 100,
                step: 1,
                default: 50,
                unit: '%'
            },
            dehalo: {
                label: 'Anti-Ringing / De-Halo',
                type: 'toggle',
                default: true
            }
        }
    },
    {
        id: 'interpolate',
        title: 'Frame Interpolation',
        tagline: 'Fluid motion synthesis & cinematic slow motion',
        badge: 'Sidecar Engine Required',
        badgeType: 'warning',
        status: EnhancementStatus.SIDECAR_REQUIRED,
        statusNote: 'Flow estimation model runs via native ONNX sidecar. Frame target configured in UI.',
        model: 'IFRNet / RIFE v4.6',
        license: 'Apache 2.0 (IFRNet) / Research (RIFE)',
        iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="5" x2="19" y2="19"/></svg>`,
        parameters: {
            targetFps: {
                label: 'Frame Rate Mode',
                type: 'select',
                options: [
                    { value: '60', label: '60 FPS (Ultra Smooth Playback)' },
                    { value: '120', label: '120 FPS (High Refresh Gaming / Sports)' },
                    { value: 'slow2x', label: '2x Slow Motion (50% Speed)' },
                    { value: 'slow4x', label: '4x Slow Motion (25% Speed)' },
                    { value: 'slow8x', label: '8x Extreme Slow Motion' }
                ],
                default: '60'
            },
            flowSensitivity: {
                label: 'Motion Vector Precision',
                type: 'select',
                options: [
                    { value: 'standard', label: 'Standard Optical Flow' },
                    { value: 'high', label: 'High Precision (Handles Rapid Occlusion)' }
                ],
                default: 'high'
            }
        }
    },
    {
        id: 'stabilize',
        title: 'AI Camera Stabilization',
        tagline: 'Two-pass camera motion path smoothing & deshake',
        badge: 'FFmpeg Profile Ready',
        badgeType: 'success',
        status: EnhancementStatus.ALGORITHMIC_READY,
        statusNote: 'Generates 2-pass libvidstab stabilization command profile. Executes in native engine.',
        model: 'FFmpeg libvidstab (Two-Pass)',
        license: 'GPL v2+ (Subprocess Isolated)',
        iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`,
        parameters: {
            smoothing: {
                label: 'Smoothing Radius',
                type: 'range',
                min: 5,
                max: 60,
                step: 1,
                default: 25,
                unit: ' frames'
            },
            mode: {
                label: 'Stabilization Camera Mode',
                type: 'select',
                options: [
                    { value: 'smooth', label: 'Smooth Handheld Jitter' },
                    { value: 'lock', label: 'Simulated Tripod (Lock Camera)' }
                ],
                default: 'smooth'
            },
            borderFill: {
                label: 'Border Compensation',
                type: 'select',
                options: [
                    { value: 'zoom', label: 'Dynamic Auto-Crop & Zoom' },
                    { value: 'mirror', label: 'Mirror Edge Padding' }
                ],
                default: 'zoom'
            }
        }
    },
    {
        id: 'batch',
        title: 'Batch Enhancement Queue',
        tagline: 'Multi-video enhancement queue with telemetry',
        badge: 'UI Queue Active',
        badgeType: 'success',
        status: EnhancementStatus.UI_CONFIGURED,
        statusNote: 'Fully active UI queue manager. Schedules jobs, computes ETAs, and manages task priority.',
        model: 'Asynchronous Task Dispatcher',
        license: 'MIT (Internal Code)',
        iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
        parameters: {
            maxConcurrent: {
                label: 'Concurrent Jobs',
                type: 'select',
                options: [
                    { value: '1', label: '1 Job (Recommended for 4GB VRAM)' },
                    { value: '2', label: '2 Jobs (Requires >8GB VRAM)' }
                ],
                default: '1'
            },
            outputFormat: {
                label: 'Output Container & Codec',
                type: 'select',
                options: [
                    { value: 'mp4_nvenc', label: 'MP4 (NVIDIA NVENC H.264 / HEVC)' },
                    { value: 'prores', label: 'QuickTime MOV (Apple ProRes 422 HQ)' },
                    { value: 'webm', label: 'WebM (VP9 Lossless)' }
                ],
                default: 'mp4_nvenc'
            }
        }
    }
];
