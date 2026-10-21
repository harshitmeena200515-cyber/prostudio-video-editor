/**
 * Project State Management
 * Handles the state of the entire project, undo/redo history,
 * and saving/loading projects.
 */

export class ProjectManager {
    constructor() {
        this.projectData = {
            id: crypto.randomUUID(),
            name: "Untitled Project",
            settings: {
                width: 1920,
                height: 1080,
                fps: 30,
                sampleRate: 48000
            },
            tracks: [], // Contains video, audio, and adjustment tracks
            media: [], // Media library references
            markers: [] // Timeline markers
        };
        
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 100;
        
        this.isDirty = false;
        
        this.init();
    }
    
    init() {
        // Initialize default tracks (2 Video, 2 Audio)
        this.addTrack('video', 'V2');
        this.addTrack('video', 'V1');
        this.addTrack('audio', 'A1');
        this.addTrack('audio', 'A2');
        
        this.saveState("Initial state");
        this.startAutoSave();
    }
    
    addTrack(type, name) {
        const track = {
            id: crypto.randomUUID(),
            type,
            name,
            visible: true,
            locked: false,
            muted: false,
            solo: false,
            clips: []
        };
        this.projectData.tracks.push(track);
        this.isDirty = true;
        return track.id;
    }
    
    getTrack(id) {
        return this.projectData.tracks.find(t => t.id === id);
    }
    
    addClipToTrack(trackId, clipData) {
        const track = this.getTrack(trackId);
        if (!track) return null;
        
        const clip = {
            id: crypto.randomUUID(),
            mediaId: clipData.mediaId,
            startAt: clipData.startAt || 0, // Position on timeline
            duration: clipData.duration || 5, // Length on timeline
            inPoint: clipData.inPoint || 0, // Start point in media file
            outPoint: clipData.inPoint ? (clipData.inPoint + clipData.duration) : (clipData.duration || 5),
            
            // Transform properties
            transform: {
                position: { x: 0, y: 0 },
                scale: 100,
                rotation: 0
            },
            
            // Compositing
            compositing: {
                blendMode: 'normal',
                opacity: 100
            },
            
            // Audio properties
            audio: {
                volume: 100,
                pan: 0,
                muted: false
            },
            
            // Applied effects
            effects: []
        };
        
        track.clips.push(clip);
        this.saveState(`Add clip to ${track.name}`);
        return clip;
    }
    
    // History System
    saveState(actionName) {
        // Truncate future history if we've undone and are now saving a new state
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Deep copy state
        const stateCopy = JSON.parse(JSON.stringify(this.projectData));
        
        this.history.push({
            action: actionName,
            state: stateCopy
        });
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.isDirty = true;
        document.dispatchEvent(new CustomEvent('project:stateChanged', { detail: { action: actionName } }));
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.projectData = JSON.parse(JSON.stringify(this.history[this.historyIndex].state));
            this.isDirty = true;
            document.dispatchEvent(new CustomEvent('project:undone'));
            return true;
        }
        return false;
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.projectData = JSON.parse(JSON.stringify(this.history[this.historyIndex].state));
            this.isDirty = true;
            document.dispatchEvent(new CustomEvent('project:redone'));
            return true;
        }
        return false;
    }
    
    // Persistence
    startAutoSave() {
        setInterval(() => {
            if (this.isDirty) {
                this.saveToStorage();
            }
        }, 30000); // 30 seconds
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('prostudio_autosave', JSON.stringify(this.projectData));
            this.isDirty = false;
            console.log('Project autosaved');
        } catch (e) {
            console.error('Failed to autosave project:', e);
        }
    }
    
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('prostudio_autosave');
            if (saved) {
                this.projectData = JSON.parse(saved);
                this.history = [{ action: 'Load Project', state: JSON.parse(saved) }];
                this.historyIndex = 0;
                document.dispatchEvent(new CustomEvent('project:loaded'));
                return true;
            }
        } catch (e) {
            console.error('Failed to load project:', e);
        }
        return false;
    }
}
