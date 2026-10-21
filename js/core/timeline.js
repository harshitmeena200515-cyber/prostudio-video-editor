/**
 * Timeline Engine
 * Manages timeline rendering, drag-and-drop, playhead, and clip interaction.
 */

export class TimelineEngine {
    constructor(projectManager) {
        this.project = projectManager;
        
        // State
        this.scale = 20; // pixels per second
        this.currentTime = 0; // in seconds
        this.isPlaying = false;
        
        // Let app.js call init()
    }
    
    init() {
        // DOM Elements
        this.container = document.querySelector('.timeline-container');
        this.tracksArea = document.querySelector('.tracks-area');
        this.rulerArea = document.querySelector('.time-ruler');
        this.playheadEl = document.querySelector('.playhead');
        
        this.bindEvents();
        this.renderRuler();
        this.updatePlayhead();
        this.setupDragAndDrop();
        this.renderClips();
    }
    
    bindEvents() {
        const zoomSlider = document.querySelector('.zoom-slider');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                this.setZoom(e.target.value);
            });
        }
        
        if (this.rulerArea) {
            this.rulerArea.addEventListener('mousedown', (e) => this.handleRulerClick(e));
            
            // Allow drag scrubbing on ruler
            let isScrubbing = false;
            this.rulerArea.addEventListener('mousedown', () => isScrubbing = true);
            document.addEventListener('mouseup', () => isScrubbing = false);
            document.addEventListener('mousemove', (e) => {
                if (isScrubbing) this.handleRulerClick(e);
            });
        }
    }
    
    setupDragAndDrop() {
        if (!this.tracksArea) return;
        
        const tracks = this.tracksArea.querySelectorAll('.track');
        
        tracks.forEach((trackEl, index) => {
            trackEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                trackEl.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            
            trackEl.addEventListener('dragleave', () => {
                trackEl.style.backgroundColor = '';
            });
            
            trackEl.addEventListener('drop', (e) => {
                e.preventDefault();
                trackEl.style.backgroundColor = '';
                
                try {
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (data.action === 'addClip') {
                        // Calculate drop time based on X coordinate
                        const rect = trackEl.getBoundingClientRect();
                        const x = e.clientX - rect.left + this.tracksArea.scrollLeft;
                        const dropTime = Math.max(0, x / this.scale);
                        
                        // Get corresponding track from project data
                        // (Assuming UI tracks map 1:1 with projectData.tracks)
                        const trackData = this.project.projectData.tracks[index];
                        if (trackData) {
                            // Fetch media duration from media manager
                            const mediaItem = this.project.projectData.media.find(m => m.id === data.mediaId);
                            // Real app would fetch exact duration from mediaLibrary
                            const duration = 5; // default 5 seconds for now
                            
                            this.project.addClipToTrack(trackData.id, {
                                mediaId: data.mediaId,
                                startAt: dropTime,
                                duration: duration
                            });
                            
                            this.renderClips();
                            // Force preview update
                            document.dispatchEvent(new CustomEvent('project:stateChanged'));
                        }
                    }
                } catch (err) {
                    console.error("Drop error", err);
                }
            });
        });
    }
    
    setZoom(value) {
        this.scale = 2 + (value / 100) * 198;
        
        const tracks = document.querySelectorAll('.track');
        tracks.forEach(track => {
            track.style.backgroundSize = `${this.scale}px 100%`;
        });
        
        this.renderRuler();
        this.updatePlayhead();
        this.renderClips();
    }
    
    renderRuler() {
        if (!this.rulerArea) return;
        this.rulerArea.innerHTML = '';
        
        let intervalSec = 1;
        if (this.scale < 10) intervalSec = 10;
        if (this.scale < 5) intervalSec = 30;
        
        const totalDuration = 3600; 
        
        for (let i = 0; i <= totalDuration; i += intervalSec) {
            const x = i * this.scale;
            if (x > 5000) break; // Arbitrary cutoff for performance
            
            const tick = document.createElement('div');
            tick.className = 'ruler-tick';
            tick.style.position = 'absolute';
            tick.style.left = `${x}px`;
            tick.style.bottom = '0';
            tick.style.width = '1px';
            tick.style.height = i % Math.max(1, intervalSec * 5) === 0 ? '12px' : '6px';
            tick.style.backgroundColor = 'var(--border-light)';
            
            if (i % Math.max(1, intervalSec * 5) === 0) {
                const label = document.createElement('div');
                label.className = 'ruler-label';
                label.style.position = 'absolute';
                label.style.left = `${x + 3}px`;
                label.style.top = '2px';
                label.style.fontSize = '9px';
                label.style.color = 'var(--text-secondary)';
                label.innerText = this.formatTime(i);
                this.rulerArea.appendChild(label);
            }
            this.rulerArea.appendChild(tick);
        }
    }
    
    formatTime(seconds) {
        const d = new Date(seconds * 1000);
        return d.toISOString().substr(11, 8);
    }
    
    handleRulerClick(e) {
        const rect = this.tracksArea.getBoundingClientRect();
        const x = e.clientX - rect.left + this.tracksArea.scrollLeft;
        
        this.currentTime = x / this.scale;
        if (this.currentTime < 0) this.currentTime = 0;
        
        this.updatePlayhead();
        document.dispatchEvent(new CustomEvent('timeline:seek', { detail: { time: this.currentTime } }));
    }
    
    updatePlayhead() {
        if (!this.playheadEl) return;
        const x = this.currentTime * this.scale;
        this.playheadEl.style.left = `${x}px`;
        
        if (this.isPlaying && this.tracksArea) {
            const rect = this.tracksArea.getBoundingClientRect();
            const relX = x - this.tracksArea.scrollLeft;
            
            if (relX > rect.width * 0.9) {
                this.tracksArea.scrollLeft = x - (rect.width * 0.1);
            }
        }
        
        const timecodeEl = document.querySelector('.timecode');
        if (timecodeEl) {
            timecodeEl.innerText = this.formatTimecode(this.currentTime, 30);
        }
    }
    
    formatTimecode(seconds, fps) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const f = Math.floor((seconds % 1) * fps);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
    }
    
    renderClips() {
        if (!this.tracksArea) return;
        
        const trackEls = this.tracksArea.querySelectorAll('.track');
        if (trackEls.length === 0) return;
        
        this.project.projectData.tracks.forEach((trackData, index) => {
            const trackEl = trackEls[index];
            if (!trackEl) return;
            
            trackEl.innerHTML = ''; // Clear current
            
            trackData.clips.forEach(clip => {
                const clipEl = document.createElement('div');
                clipEl.className = 'timeline-clip';
                clipEl.style.position = 'absolute';
                clipEl.style.left = `${clip.startAt * this.scale}px`;
                clipEl.style.width = `${clip.duration * this.scale}px`;
                clipEl.style.height = '100%';
                clipEl.style.backgroundColor = trackData.type === 'video' ? '#2563eb' : '#16a34a';
                clipEl.style.border = '1px solid rgba(255,255,255,0.2)';
                clipEl.style.borderRadius = '4px';
                clipEl.style.cursor = 'move';
                clipEl.style.overflow = 'hidden';
                
                // Content
                clipEl.innerHTML = `<div style="padding: 4px; font-size: 10px; color: white;">${clip.mediaId.substring(0,8)}</div>`;
                
                // Add left/right trim handles
                const leftHandle = document.createElement('div');
                leftHandle.style.position = 'absolute';
                leftHandle.style.left = '0';
                leftHandle.style.top = '0';
                leftHandle.style.bottom = '0';
                leftHandle.style.width = '5px';
                leftHandle.style.cursor = 'ew-resize';
                leftHandle.style.backgroundColor = 'rgba(255,255,255,0.5)';
                
                const rightHandle = document.createElement('div');
                rightHandle.style.position = 'absolute';
                rightHandle.style.right = '0';
                rightHandle.style.top = '0';
                rightHandle.style.bottom = '0';
                rightHandle.style.width = '5px';
                rightHandle.style.cursor = 'ew-resize';
                rightHandle.style.backgroundColor = 'rgba(255,255,255,0.5)';
                
                clipEl.appendChild(leftHandle);
                clipEl.appendChild(rightHandle);
                
                // Basic Drag to Move (Mock)
                let isDragging = false;
                let startX = 0;
                let initialStartAt = 0;
                
                clipEl.addEventListener('mousedown', (e) => {
                    if (e.target === leftHandle || e.target === rightHandle) return; // handled by trim
                    isDragging = true;
                    startX = e.clientX;
                    initialStartAt = clip.startAt;
                    e.stopPropagation(); // prevent ruler seek
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    const deltaX = e.clientX - startX;
                    let newStartAt = initialStartAt + (deltaX / this.scale);
                    if (newStartAt < 0) newStartAt = 0;
                    
                    clip.startAt = newStartAt;
                    clipEl.style.left = `${clip.startAt * this.scale}px`;
                });
                
                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        this.project.isDirty = true;
                        document.dispatchEvent(new CustomEvent('project:stateChanged'));
                    }
                });
                
                // Basic Trimming (Right handle)
                let isTrimmingRight = false;
                let trimStartX = 0;
                let initialDuration = 0;
                
                rightHandle.addEventListener('mousedown', (e) => {
                    isTrimmingRight = true;
                    trimStartX = e.clientX;
                    initialDuration = clip.duration;
                    e.stopPropagation();
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isTrimmingRight) return;
                    const deltaX = e.clientX - trimStartX;
                    let newDuration = initialDuration + (deltaX / this.scale);
                    if (newDuration < 0.1) newDuration = 0.1;
                    
                    clip.duration = newDuration;
                    clipEl.style.width = `${clip.duration * this.scale}px`;
                });
                
                document.addEventListener('mouseup', () => {
                    if (isTrimmingRight) {
                        isTrimmingRight = false;
                        this.project.isDirty = true;
                        document.dispatchEvent(new CustomEvent('project:stateChanged'));
                    }
                });
                
                trackEl.appendChild(clipEl);
            });
        });
    }
}
