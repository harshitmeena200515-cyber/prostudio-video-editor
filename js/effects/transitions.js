/**
 * Transitions Library
 * Expanded to include all requested transitions.
 */

export const Transitions = {
    basic: [
        { id: 'fade', name: 'Fade', type: 'basic' },
        { id: 'crossFade', name: 'Cross Fade', type: 'basic' },
        { id: 'dissolve', name: 'Dissolve', type: 'basic' }
    ],
    zoom: [
        { id: 'zoom', name: 'Zoom', type: 'zoom' },
        { id: 'zoomIn', name: 'Zoom In', type: 'zoom' },
        { id: 'zoomOut', name: 'Zoom Out', type: 'zoom' }
    ],
    motion: [
        { id: 'spin', name: 'Spin', type: 'motion' },
        { id: 'rotate', name: 'Rotate', type: 'motion' },
        { id: 'push', name: 'Push', type: 'motion' },
        { id: 'slide', name: 'Slide', type: 'motion' },
        { id: 'swipe', name: 'Swipe', type: 'motion' },
        { id: 'flip', name: 'Flip', type: 'motion' },
        { id: 'cube', name: 'Cube', type: 'motion' },
        { id: 'cameraRoll', name: 'Camera Roll', type: 'motion' },
        { id: 'whipPan', name: 'Whip Pan', type: 'motion' }
    ],
    distort: [
        { id: 'warp', name: 'Warp', type: 'distort' },
        { id: 'stretch', name: 'Stretch', type: 'distort' },
        { id: 'ripple', name: 'Ripple', type: 'distort' }
    ],
    trending: [
        { id: 'flash', name: 'Flash', type: 'trending' },
        { id: 'glitch', name: 'Glitch', type: 'trending' },
        { id: 'blur', name: 'Blur Transition', type: 'trending' }
    ]
};

export function getAllTransitions() {
    let all = [];
    Object.values(Transitions).forEach(cat => {
        all = all.concat(cat);
    });
    return all;
}
