/**
 * Photo Editor Core
 * Wraps the Video Effects engine to apply them statically to a single image.
 */
import { VideoEffects } from '../effects/video-effects.js';

export class PhotoEditor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        
        // Same property structure as a video clip for consistency
        this.state = {
            transform: {
                position: { x: 0, y: 0 },
                scale: 100,
                rotation: 0,
                flipX: false,
                flipY: false
            },
            adjustments: {
                brightness: 0,
                contrast: 100,
                saturation: 100,
                temperature: 0,
                tint: 0,
                sharpness: 0
            },
            crop: null
        };
    }
    
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.canvas.width = img.naturalWidth;
                this.canvas.height = img.naturalHeight;
                this.render();
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });
    }
    
    render() {
        if (!this.image) return;
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.ctx.clearRect(0, 0, w, h);
        
        this.ctx.save();
        
        // CSS Filters are an easy way to implement basic adjustments on Canvas
        // More complex ones use WebGL (via our shaders.js)
        const adj = this.state.adjustments;
        this.ctx.filter = `
            brightness(${100 + adj.brightness}%) 
            contrast(${adj.contrast}%) 
            saturate(${adj.saturation}%)
            hue-rotate(${adj.temperature * 0.5}deg)
        `;
        
        // Transform
        const cx = w/2;
        const cy = h/2;
        this.ctx.translate(cx, cy);
        this.ctx.rotate(this.state.transform.rotation * Math.PI / 180);
        this.ctx.scale(
            (this.state.transform.scale / 100) * (this.state.transform.flipX ? -1 : 1), 
            (this.state.transform.scale / 100) * (this.state.transform.flipY ? -1 : 1)
        );
        this.ctx.translate(-cx, -cy);
        
        this.ctx.drawImage(this.image, 0, 0, w, h);
        
        this.ctx.restore();
    }
    
    exportImage(format = 'image/jpeg', quality = 0.9) {
        return this.canvas.toDataURL(format, quality);
    }
}
