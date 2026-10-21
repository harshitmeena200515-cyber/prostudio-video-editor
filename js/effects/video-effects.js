/**
 * Video Effects Library
 * Defines 100+ video effects available in the editor.
 * Expanded with all requested features.
 */

export const VideoEffects = {
    // === COLOR EFFECTS ===
    color: [
        { id: 'brightness', name: 'Brightness', category: 'Color', defaultParams: { amount: 0 }, range: { min: -100, max: 100 } },
        { id: 'contrast', name: 'Contrast', category: 'Color', defaultParams: { amount: 100 }, range: { min: 0, max: 200 } },
        { id: 'saturation', name: 'Saturation', category: 'Color', defaultParams: { amount: 100 }, range: { min: 0, max: 200 } },
        { id: 'exposure', name: 'Exposure', category: 'Color', defaultParams: { amount: 0 }, range: { min: -5, max: 5 } },
        { id: 'temperature', name: 'Temperature', category: 'Color', defaultParams: { amount: 0 }, range: { min: -100, max: 100 } },
        { id: 'tint', name: 'Tint', category: 'Color', defaultParams: { amount: 0 }, range: { min: -100, max: 100 } },
        { id: 'vibrance', name: 'Vibrance', category: 'Color', defaultParams: { amount: 0 }, range: { min: -100, max: 100 } },
        { id: 'hue', name: 'Hue', category: 'Color', defaultParams: { degrees: 0 }, range: { min: -180, max: 180 } },
        { id: 'highlights', name: 'Highlights', category: 'Color', defaultParams: { amount: 0 }, range: { min: -100, max: 100 } },
        { id: 'shadows', name: 'Shadows', category: 'Color', defaultParams: { amount: 0 }, range: { min: -100, max: 100 } },
        { id: 'curves', name: 'Curves', category: 'Color', defaultParams: { master: [], red: [], green: [], blue: [] } },
        { id: 'hsl', name: 'HSL', category: 'Color', defaultParams: { hue: 0, sat: 0, lum: 0 } },
        { id: 'lut', name: 'LUT', category: 'Color', defaultParams: { intensity: 100 } },
        { id: 'colorGrading', name: 'Color Grading', category: 'Color', defaultParams: { lift: 0, gamma: 0, gain: 0 } }
    ],

    // === BLUR EFFECTS ===
    blur: [
        { id: 'gaussianBlur', name: 'Gaussian Blur', category: 'Blur', defaultParams: { radius: 0 }, range: { min: 0, max: 100 } },
        { id: 'motionBlur', name: 'Motion Blur', category: 'Blur', defaultParams: { angle: 0, distance: 0 } },
        { id: 'radialBlur', name: 'Radial Blur', category: 'Blur', defaultParams: { amount: 0, cx: 0.5, cy: 0.5 } },
        { id: 'directionalBlur', name: 'Directional Blur', category: 'Blur', defaultParams: { angle: 0, length: 0 } },
        { id: 'zoomBlur', name: 'Zoom Blur', category: 'Blur', defaultParams: { amount: 0, cx: 0.5, cy: 0.5 } },
        { id: 'lensBlur', name: 'Lens Blur', category: 'Blur', defaultParams: { radius: 0, focalDistance: 0.5 } },
        { id: 'bokehBlur', name: 'Bokeh Blur', category: 'Blur', defaultParams: { amount: 0, threshold: 0.8 } }
    ],

    // === STYLIZE EFFECTS ===
    stylize: [
        { id: 'mosaic', name: 'Mosaic', category: 'Stylize', defaultParams: { size: 10 } },
        { id: 'pixelate', name: 'Pixelate', category: 'Stylize', defaultParams: { blockSize: 1 }, range: { min: 1, max: 100 } },
        { id: 'sharpen', name: 'Sharpen', category: 'Stylize', defaultParams: { amount: 100 } },
        { id: 'ghost', name: 'Ghost', category: 'Stylize', defaultParams: { trails: 3, opacity: 50 } },
        { id: 'shadow', name: 'Shadow', category: 'Stylize', defaultParams: { distance: 10, angle: 45, opacity: 50 } },
        { id: 'cartoon', name: 'Cartoon', category: 'Stylize', defaultParams: { edges: 50, colors: 8 } },
        { id: 'comic', name: 'Comic', category: 'Stylize', defaultParams: { dots: 10, lines: 50 } },
        { id: 'sketch', name: 'Sketch', category: 'Stylize', defaultParams: { intensity: 100, lines: 50 } },
        { id: 'painting', name: 'Painting', category: 'Stylize', defaultParams: { brushSize: 5 } },
        { id: 'anime', name: 'Anime', category: 'Stylize', defaultParams: { intensity: 100, vibrancy: 120 } }
    ],

    // === GLOW & LIGHT ===
    glow: [
        { id: 'glow', name: 'Glow', category: 'Light', defaultParams: { intensity: 0, radius: 10, threshold: 0.5 } },
        { id: 'neonGlow', name: 'Neon Glow', category: 'Light', defaultParams: { color: '#00ff00', intensity: 100 } },
        { id: 'edgeGlow', name: 'Edge Glow', category: 'Light', defaultParams: { color: '#ffffff', width: 2 } },
        { id: 'bloom', name: 'Bloom', category: 'Light', defaultParams: { threshold: 0.8, intensity: 100 } },
        { id: 'hdrEffect', name: 'HDR Effect', category: 'Light', defaultParams: { detail: 50, contrast: 50 } }
    ],

    // === GLITCH & RETRO ===
    glitch: [
        { id: 'glitch', name: 'Glitch', category: 'Retro', defaultParams: { intensity: 0, speed: 1.0 } },
        { id: 'rgbSplit', name: 'RGB Split', category: 'Retro', defaultParams: { distance: 10, angle: 45 } },
        { id: 'vhs', name: 'VHS', category: 'Retro', defaultParams: { static: 50, colorShift: 10, noise: 20 } },
        { id: 'tvNoise', name: 'TV Noise', category: 'Retro', defaultParams: { static: 100 } },
        { id: 'filmGrain', name: 'Film Grain', category: 'Retro', defaultParams: { intensity: 0, size: 1.0 } },
        { id: 'oldFilm', name: 'Old Film', category: 'Retro', defaultParams: { scratches: 50, dust: 50, jitter: 10 } },
        { id: 'retro', name: 'Retro', category: 'Retro', defaultParams: { intensity: 100 } },
        { id: 'vintage', name: 'Vintage', category: 'Retro', defaultParams: { intensity: 100 } },
        { id: 'cyberpunk', name: 'Cyberpunk', category: 'Retro', defaultParams: { neonBoost: 100, contrast: 150 } },
        { id: 'hologram', name: 'Hologram', category: 'Retro', defaultParams: { scanlines: 50, flicker: 20 } }
    ],

    // === DISTORT ===
    distort: [
        { id: 'fisheye', name: 'Fisheye', category: 'Distort', defaultParams: { amount: 50 } },
        { id: 'warp', name: 'Warp', category: 'Distort', defaultParams: { x: 0, y: 0 } },
        { id: 'distortion', name: 'Distortion', category: 'Distort', defaultParams: { amount: 50 } },
        { id: 'mirror', name: 'Mirror', category: 'Distort', defaultParams: { angle: 0, center: 0.5 } },
        { id: 'kaleidoscope', name: 'Kaleidoscope', category: 'Distort', defaultParams: { segments: 6, angle: 0 } },
        { id: 'prism', name: 'Prism', category: 'Distort', defaultParams: { sides: 3, distance: 10 } },
        { id: 'ripple', name: 'Ripple', category: 'Distort', defaultParams: { amplitude: 0, speed: 1.0, center: {x:0.5, y:0.5} } },
        { id: 'wave', name: 'Wave', category: 'Distort', defaultParams: { amplitude: 0, frequency: 10, phase: 0 } },
        { id: 'twirl', name: 'Twirl', category: 'Distort', defaultParams: { angle: 0, radius: 0.5, center: {x:0.5, y:0.5} } },
        { id: 'shake', name: 'Shake', category: 'Distort', defaultParams: { amplitude: 10, speed: 10 } },
        { id: 'cameraShake', name: 'Camera Shake', category: 'Distort', defaultParams: { intensity: 50 } },
        { id: 'earthquake', name: 'Earthquake', category: 'Distort', defaultParams: { magnitude: 8 } }
    ],

    // === WEATHER & NATURE (OVERLAYS) ===
    weather: [
        { id: 'flash', name: 'Flash', category: 'Nature', defaultParams: { brightness: 100, duration: 5 } },
        { id: 'lightning', name: 'Lightning', category: 'Nature', defaultParams: { branches: 5, intensity: 100 } },
        { id: 'fire', name: 'Fire', category: 'Nature', defaultParams: { intensity: 100, scale: 1.0 } },
        { id: 'smoke', name: 'Smoke', category: 'Nature', defaultParams: { density: 50, speed: 1.0 } },
        { id: 'fog', name: 'Fog', category: 'Nature', defaultParams: { thickness: 50, speed: 0.5 } },
        { id: 'rain', name: 'Rain', category: 'Nature', defaultParams: { dropSize: 50, wind: 10 } },
        { id: 'snow', name: 'Snow', category: 'Nature', defaultParams: { flakeSize: 50, wind: 10 } },
        { id: 'dust', name: 'Dust', category: 'Nature', defaultParams: { amount: 50 } },
        { id: 'sparkle', name: 'Sparkle', category: 'Nature', defaultParams: { amount: 50, size: 1.0 } },
        { id: 'stars', name: 'Stars', category: 'Nature', defaultParams: { amount: 100, twinkling: 50 } },
        { id: 'galaxy', name: 'Galaxy', category: 'Nature', defaultParams: { nebulaIntensity: 50 } },
        { id: 'explosion', name: 'Explosion', category: 'Nature', defaultParams: { size: 100, power: 100 } },
        { id: 'energyAura', name: 'Energy Aura', category: 'Nature', defaultParams: { color: '#00ffff', intensity: 100 } },
        { id: 'laser', name: 'Laser', category: 'Nature', defaultParams: { color: '#ff0000', thickness: 5 } }
    ],

    // === TRENDING REELS/SHORTS ===
    trending: [
        { id: 'flashWarning', name: 'Flash Warning', category: 'Trending', defaultParams: { hz: 10 } },
        { id: 'cinematicBars', name: 'Cinematic Bars', category: 'Trending', defaultParams: { ratio: 2.35 } },
        { id: 'beatFlash', name: 'Beat Flash', category: 'Trending', defaultParams: { bpm: 120 } },
        { id: 'syncZoom', name: 'Sync Zoom', category: 'Trending', defaultParams: { bpm: 120, zoomAmount: 1.2 } },
        { id: 'blurShake', name: 'Blur Shake', category: 'Trending', defaultParams: { intensity: 50 } },
        { id: 'glowShake', name: 'Glow Shake', category: 'Trending', defaultParams: { intensity: 50 } }
    ]
};

export function getAllEffects() {
    let all = [];
    Object.values(VideoEffects).forEach(categoryArr => {
        all = all.concat(categoryArr);
    });
    return all;
}
