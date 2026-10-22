/**
 * ProStudio Editor - Main Application Entry Point
 * Orchestrates all modules and handles global application state.
 */

import { ProjectManager } from './core/project.js';
import { TimelineEngine } from './core/timeline.js';
import { PreviewEngine } from './core/preview.js';
import { MediaManager } from './core/media-manager.js';
import { getAllAdvancedTools } from './core/advanced-tools.js';
import { AudioEngine } from './audio/audio-engine.js';
import { RendererPipeline } from './export/renderer.js';
import { PhotoUI } from './photo/photo-ui.js';

import { initPanels } from './ui/panels.js';
import { renderLibrary } from './ui/library-renderer.js';
import { initShortcuts } from './ui/keyboard-shortcuts.js';
import { initContextMenus } from './ui/context-menus.js';
import { ProStudioAI } from './ai/ai-studio.js';

class App {
    constructor() {
        this.projectManager = new ProjectManager();
        this.audioEngine = new AudioEngine();
        this.timelineEngine = new TimelineEngine(this.projectManager);
        this.previewEngine = new PreviewEngine(this.projectManager);
        this.mediaManager = new MediaManager(this.projectManager);
        this.renderer = new RendererPipeline(this.previewEngine, this.audioEngine);
        this.photoUI = new PhotoUI(this);
        
        this.currentMode = 'video'; // video, color, audio, photo
        
        this.init();
    }
    
    init() {
        // Initialize UI
        initPanels();
        renderLibrary();
        initShortcuts(this);
        initContextMenus();
        
        // Initialize Media Manager
        this.mediaManager.init();
        
        // Initialize AI Studio Neural Engine
        this.aiStudio = new ProStudioAI(this);
        
        this.bindEvents();
        
        console.log("🎬 ProStudio Editor Initialized");
    }
    
    bindEvents() {
        // Playback controls
        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => this.togglePlayback());
        }
        
        // Mode Switcher
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                modeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.setMode(e.target.getAttribute('data-mode'));
            });
        });
        
        // Export
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                this.renderer.startExport({
                    format: 'webm',
                    fps: 30,
                    width: 1920,
                    height: 1080
                });
            });
        }
        
        // Listen to timeline play/pause events from renderer
        document.addEventListener('timeline:play', () => {
            if (!this.timelineEngine.isPlaying) this.togglePlayback();
        });
        document.addEventListener('timeline:pause', () => {
            if (this.timelineEngine.isPlaying) this.togglePlayback();
        });
    }
    
    togglePlayback() {
        this.timelineEngine.isPlaying = !this.timelineEngine.isPlaying;
        
        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) {
            btnPlay.innerText = this.timelineEngine.isPlaying ? '⏸' : '▶';
        }
        
        if (this.timelineEngine.isPlaying) {
            this.audioEngine.resume();
            this.playbackLoop();
        } else {
            this.audioEngine.suspend();
            cancelAnimationFrame(this.playbackFrame);
        }
    }
    
    playbackLoop() {
        if (!this.timelineEngine.isPlaying) return;
        
        // Simple time progression based on wall clock
        // In a real app, this should sync with AudioContext.currentTime for perfect AV sync
        this.timelineEngine.currentTime += (1 / this.projectManager.projectData.settings.fps);
        this.timelineEngine.updatePlayhead();
        
        this.previewEngine.requestRender(this.timelineEngine.currentTime);
        
        this.playbackFrame = requestAnimationFrame(() => this.playbackLoop());
    }
    
    setMode(mode) {
        if (this.currentMode === 'photo') {
            this.photoUI.deactivate();
        }
        
        this.currentMode = mode;
        document.body.className = `theme-dark mode-${mode}`;
        
        if (mode === 'photo') {
            this.photoUI.activate();
        }
    }
    
    // Tools actions called from shortcuts
    setTool(tool) {
        console.log(`Tool selected: ${tool}`);
    }
    
    setInPoint() {
        console.log(`In point set at ${this.timelineEngine.currentTime}`);
    }
    
    setOutPoint() {
        console.log(`Out point set at ${this.timelineEngine.currentTime}`);
    }
    
    deleteSelected() {
        console.log(`Deleted selected clips`);
    }
}

// Boot the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.proStudioApp = new App();
});
