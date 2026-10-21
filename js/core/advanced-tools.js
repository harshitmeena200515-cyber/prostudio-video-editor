/**
 * Advanced Tools Registry
 * Houses definitions and UI placeholders for all complex tools:
 * AI, Motion, Green Screen, and Professional features.
 */

export const AdvancedTools = {
    // === AI TOOLS ===
    ai: [
        { id: 'aiCutout', name: 'AI Cutout', type: 'ai' },
        { id: 'aiBgRemoval', name: 'AI Background Removal', type: 'ai' },
        { id: 'aiReplace', name: 'AI Replace', type: 'ai' },
        { id: 'aiEnhance', name: 'AI Enhance', type: 'ai' },
        { id: 'aiUpscale', name: 'AI Upscale (4K/8K)', type: 'ai' },
        { id: 'aiColorize', name: 'AI Colorize (B&W to Color)', type: 'ai' },
        { id: 'aiAvatar', name: 'AI Avatar', type: 'ai' },
        { id: 'aiVoice', name: 'AI Voice Generator (TTS)', type: 'ai' },
        { id: 'aiScriptGen', name: 'AI Script Generator', type: 'ai' },
        { id: 'aiSubtitleGen', name: 'AI Subtitle Generator', type: 'ai' },
        { id: 'aiTranslation', name: 'AI Translation', type: 'ai' },
        { id: 'aiMotionTrack', name: 'AI Motion Tracking', type: 'ai' }
    ],

    // === MOTION TOOLS ===
    motion: [
        { id: 'keyframes', name: 'Keyframes', type: 'motion' },
        { id: 'motionTracking', name: 'Motion Tracking', type: 'motion' },
        { id: 'cameraTracking', name: 'Camera Tracking', type: 'motion' },
        { id: 'objectTracking', name: 'Object Tracking', type: 'motion' },
        { id: 'velocityEdit', name: 'Velocity Edit', type: 'motion' },
        { id: 'smoothVelocity', name: 'Smooth Velocity', type: 'motion' },
        { id: 'speedRamp', name: 'Speed Ramp', type: 'motion' },
        { id: 'slowMotion', name: 'Smooth Slow Motion', type: 'motion' },
        { id: 'timeRemapping', name: 'Time Remapping', type: 'motion' },
        { id: 'freezeFrame', name: 'Freeze Frame', type: 'motion' },
        { id: 'reverseVideo', name: 'Reverse Video', type: 'motion' }
    ],

    // === GREEN SCREEN TOOLS ===
    keying: [
        { id: 'chromaKey', name: 'Chroma Key (Green Screen)', type: 'keying' },
        { id: 'colorKey', name: 'Color Key', type: 'keying' },
        { id: 'lumaKey', name: 'Luma Key', type: 'keying' },
        { id: 'bgRemoval', name: 'Background Removal', type: 'keying' }
    ],

    // === PROFESSIONAL EDITING TOOLS ===
    pro: [
        { id: 'multiCam', name: 'Multi Cam Editing', type: 'pro' },
        { id: 'nestSequence', name: 'Nest Sequence (Pre-compose)', type: 'pro' },
        { id: 'adjustmentLayer', name: 'Adjustment Layer', type: 'pro' },
        { id: 'masking', name: 'Masking', type: 'pro' },
        { id: 'rotoscoping', name: 'Rotoscoping', type: 'pro' },
        { id: 'blendModes', name: 'Blend Modes', type: 'pro' },
        { id: 'opacityControl', name: 'Opacity Control', type: 'pro' },
        { id: 'pip', name: 'Picture in Picture (PIP)', type: 'pro' },
        { id: 'overlay', name: 'Overlay', type: 'pro' },
        { id: 'splitScreen', name: 'Split Screen', type: 'pro' }
    ]
};

/**
 * Returns a flat array of all advanced tools for UI rendering
 */
export function getAllAdvancedTools() {
    let all = [];
    Object.values(AdvancedTools).forEach(cat => {
        all = all.concat(cat);
    });
    return all;
}
