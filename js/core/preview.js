/**
 * Preview Renderer Engine
 * Handles Canvas/WebGL rendering of the video preview, including
 * compositing clips, applying transforms, and basic overlay drawing.
 */

export class PreviewEngine {
    constructor(projectManager) {
        this.project = projectManager;
        
        // DOM Elements
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State
        this.quality = 1.0; // 1.0 = Full, 0.5 = Half, 0.25 = Quarter
        this.renderRequested = false;
        
        this.init();
    }
    
    init() {
        this.updateCanvasSize();
        
        // Quality selector
        const qualitySelect = document.querySelector('.quality-select');
        if (qualitySelect) {
            qualitySelect.addEventListener('change', (e) => {
                switch(e.target.value) {
                    case 'Full': this.quality = 1.0; break;
                    case '1/2': this.quality = 0.5; break;
                    case '1/4': this.quality = 0.25; break;
                }
                this.updateCanvasSize();
                this.requestRender();
            });
        }
        
        // Listen for seek events
        document.addEventListener('timeline:seek', (e) => {
            this.requestRender(e.detail.time);
        });
        
        // Listen for project changes that require re-render
        document.addEventListener('project:stateChanged', () => this.requestRender());
        
        // Initial render
        this.requestRender();
    }
    
    updateCanvasSize() {
        const settings = this.project.projectData.settings;
        this.canvas.width = settings.width * this.quality;
        this.canvas.height = settings.height * this.quality;
    }
    
    requestRender(time = null) {
        if (time !== null) {
            this.currentTime = time;
        }
        
        if (!this.renderRequested) {
            this.renderRequested = true;
            requestAnimationFrame(() => this.render());
        }
    }
    
    render() {
        this.renderRequested = false;
        
        const settings = this.project.projectData.settings;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, w, h);
        
        // Save state
        this.ctx.save();
        
        // Apply quality scale
        this.ctx.scale(this.quality, this.quality);
        
        // Determine visible clips at currentTime
        const visibleClips = this.getVisibleClips(this.currentTime);
        
        // Render from bottom track to top track
        for (let i = visibleClips.length - 1; i >= 0; i--) {
            this.renderClip(visibleClips[i]);
        }
        
        this.ctx.restore();
    }
    
    getVisibleClips(time) {
        const visible = [];
        
        // Process tracks bottom to top (V1 is underneath V2 usually, wait, in UI V2 is above V1)
        // Let's assume projectData.tracks is ordered Top to Bottom. So we reverse it.
        const videoTracks = this.project.projectData.tracks
            .filter(t => t.type === 'video' && t.visible && !t.muted)
            .reverse();
            
        for (const track of videoTracks) {
            for (const clip of track.clips) {
                if (time >= clip.startAt && time < (clip.startAt + clip.duration)) {
                    visible.push(clip);
                }
            }
        }
        
        return visible;
    }
    
    renderClip(clip) {
        // Placeholder for actual media rendering.
        // In a real app, this would get the HTMLVideoElement or HTMLImageElement
        // from the MediaManager and use ctx.drawImage()
        
        this.ctx.save();
        
        // Apply transform
        const tx = clip.transform.position.x;
        const ty = clip.transform.position.y;
        const scale = clip.transform.scale / 100;
        const rot = clip.transform.rotation * Math.PI / 180;
        
        // Transform origin is center
        const cx = this.project.projectData.settings.width / 2;
        const cy = this.project.projectData.settings.height / 2;
        
        this.ctx.translate(cx + tx, cy + ty);
        this.ctx.rotate(rot);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-cx, -cy);
        
        // Apply compositing
        this.ctx.globalAlpha = clip.compositing.opacity / 100;
        // Map UI blend modes to Canvas blend modes
        let compositeOp = 'source-over';
        switch (clip.compositing.blendMode.toLowerCase()) {
            case 'multiply': compositeOp = 'multiply'; break;
            case 'screen': compositeOp = 'screen'; break;
            case 'overlay': compositeOp = 'overlay'; break;
        }
        this.ctx.globalCompositeOperation = compositeOp;
        
        // Draw media
        let mediaDrawn = false;
        
        if (window.proStudioApp && window.proStudioApp.mediaManager) {
            const mediaItem = window.proStudioApp.mediaManager.mediaLibrary.get(clip.mediaId);
            if (mediaItem && mediaItem.thumbnail) {
                if (!mediaItem.imgObj) {
                    mediaItem.imgObj = new Image();
                    mediaItem.imgObj.src = mediaItem.thumbnail;
                    mediaItem.imgObj.onload = () => this.requestRender(); // Force re-render once loaded
                }
                
                if (mediaItem.imgObj.complete && mediaItem.imgObj.naturalWidth > 0) {
                    // Draw preserving aspect ratio
                    const iw = mediaItem.imgObj.naturalWidth;
                    const ih = mediaItem.imgObj.naturalHeight;
                    const targetW = 800; // fit into default 800x450 boundary for now
                    const targetH = 450;
                    
                    this.ctx.drawImage(mediaItem.imgObj, cx - targetW/2, cy - targetH/2, targetW, targetH);
                    mediaDrawn = true;
                }
            }
        }
        
        if (!mediaDrawn) {
            this.ctx.fillStyle = '#3b82f6';
            this.ctx.fillRect(cx - 400, cy - 225, 800, 450); // Dummy 16:9 box
        }
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Media: ${clip.mediaId.substring(0, 8)}`, cx, cy);
        
        this.ctx.restore();
    }
}
