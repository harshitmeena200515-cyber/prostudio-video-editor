/**
 * Media Manager
 * Handles importing files, extracting thumbnails/metadata,
 * and managing the project's media library.
 */

export class MediaManager {
    constructor(projectManager) {
        this.project = projectManager;
        this.mediaLibrary = new Map();
        
        // Let app.js call init() after DOM is ready
    }
    
    init() {
        this.mediaGrid = document.querySelector('.media-grid');
        // Find the import button by matching text content or specific class structure in new layout
        // In index.html: <button class="primary-btn" title="Import Media" style="width: 100%;">➕ Import</button>
        this.importBtn = document.querySelector('button[title="Import Media"]');
        
        if (this.importBtn) {
            this.importBtn.addEventListener('click', () => this.triggerFileSelect());
        } else {
            console.warn("Import button not found");
        }
        
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        if (!this.mediaGrid) return;
        
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.mediaGrid.addEventListener(eventName, preventDefaults, false);
        });
        
        this.mediaGrid.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            let files = dt.files;
            this.handleFiles(files);
        }, false);
    }
    
    triggerFileSelect() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'video/*, audio/*, image/*';
        
        input.onchange = (e) => {
            this.handleFiles(e.target.files);
        };
        
        input.click();
    }
    
    handleFiles(files) {
        const fileArray = Array.from(files);
        fileArray.forEach(file => {
            this.importMedia(file);
        });
    }
    
    async importMedia(file) {
        const id = crypto.randomUUID();
        const type = file.type.split('/')[0];
        const url = URL.createObjectURL(file);
        
        const mediaItem = {
            id,
            file,
            name: file.name,
            type,
            url,
            size: file.size,
            dateAdded: Date.now()
        };
        
        if (type === 'video') {
            await this.extractVideoMetadata(mediaItem);
        } else if (type === 'image') {
            await this.extractImageMetadata(mediaItem);
        } else if (type === 'audio') {
            await this.extractAudioMetadata(mediaItem);
        }
        
        this.mediaLibrary.set(id, mediaItem);
        
        this.project.projectData.media.push({
            id,
            name: file.name,
            type
        });
        this.project.isDirty = true;
        
        this.renderMediaGrid();
    }
    
    extractVideoMetadata(item) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                item.duration = video.duration;
                item.width = video.videoWidth;
                item.height = video.videoHeight;
                video.currentTime = Math.min(1.0, video.duration / 2);
            };
            
            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 160;
                canvas.height = 90;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                item.thumbnail = canvas.toDataURL();
                resolve();
            };
            video.onerror = () => {
                 item.thumbnail = null; // Fallback
                 resolve();
            };
            
            video.src = item.url;
        });
    }
    
    extractImageMetadata(item) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                item.width = img.naturalWidth;
                item.height = img.naturalHeight;
                item.thumbnail = item.url;
                resolve();
            };
            img.src = item.url;
        });
    }
    
    extractAudioMetadata(item) {
        return new Promise((resolve) => {
            const audio = document.createElement('audio');
            audio.onloadedmetadata = () => {
                item.duration = audio.duration;
                resolve();
            };
            audio.src = item.url;
        });
    }
    
    renderMediaGrid() {
        if (!this.mediaGrid) return;
        if (this.mediaLibrary.size === 0) return;
        
        if (this.mediaGrid.classList.contains('empty-state')) {
            this.mediaGrid.classList.remove('empty-state');
            this.mediaGrid.style.display = 'grid';
            this.mediaGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
            this.mediaGrid.style.gap = '8px';
            this.mediaGrid.style.padding = '8px';
            this.mediaGrid.style.alignContent = 'start';
        }
        
        this.mediaGrid.innerHTML = '';
        
        this.mediaLibrary.forEach(item => {
            const el = document.createElement('div');
            el.className = 'media-item';
            el.style.backgroundColor = 'var(--bg-element)';
            el.style.border = '1px solid var(--border-light)';
            el.style.borderRadius = 'var(--radius-sm)';
            el.style.overflow = 'hidden';
            el.style.cursor = 'grab';
            
            el.draggable = true;
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                    action: 'addClip',
                    mediaId: item.id,
                    type: item.type
                }));
            });
            
            let thumbHtml = '';
            if (item.thumbnail) {
                thumbHtml = `<img src="${item.thumbnail}" style="width: 100%; height: 56px; object-fit: cover;">`;
            } else {
                let icon = item.type === 'audio' ? '🎵' : '📄';
                thumbHtml = `<div style="height: 56px; display: flex; align-items: center; justify-content: center; font-size: 24px;">${icon}</div>`;
            }
            
            el.innerHTML = `
                ${thumbHtml}
                <div style="padding: 4px; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.name}">
                    ${item.name}
                </div>
                <div style="padding: 0 4px 4px 4px; font-size: 9px; color: var(--text-secondary);">
                    ${item.duration ? this.formatDuration(item.duration) : item.type}
                </div>
            `;
            
            this.mediaGrid.appendChild(el);
        });
    }
    
    formatDuration(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}
