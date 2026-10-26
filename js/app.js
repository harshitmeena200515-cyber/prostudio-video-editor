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
import { EnhancementUI } from './ai/enhancement-ui.js';

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
        this.enhancementUI = new EnhancementUI(this);
        
        this.currentMode = 'video'; // video, color, audio, photo
        
        this.init();
    }
    
    init() {
        // Initialize AI Studio Neural Engine first so its pane/tab exists
        this.aiStudio = new ProStudioAI(this);

        // Initialize UI
        initPanels();
        renderLibrary();
        initShortcuts(this);
        initContextMenus();
        
        // Initialize Media Manager
        this.mediaManager.init();
        
        this.bindEvents();
        
        const urlParams = new URLSearchParams(window.location.search);
        const initialMode = urlParams.get('mode');
        if (initialMode && ['video', 'enhance', 'photo', 'aistudio'].includes(initialMode)) {
            this.setMode(initialMode);
        }

        console.log("🎬 ProStudio Editor Initialized");
    }
    
    bindEvents() {
        // Playback controls
        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => this.togglePlayback());
        }
        
        // Mode Switcher (Pills & Buttons)
        const modeBtns = document.querySelectorAll('.mode-btn, .mode-pill-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.getAttribute('data-mode');
                if (mode) this.setMode(mode);
            });
        });

        // AI Tools Dropdown -> AI Enhance shortcut
        document.querySelectorAll('.dropdown-content div').forEach(item => {
            if (item.innerText && item.innerText.trim() === 'AI Enhance') {
                item.addEventListener('click', () => this.setMode('enhance'));
            }
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
        if (this.currentMode === 'enhance') {
            this.enhancementUI.deactivate();
        }
        
        this.currentMode = mode;
        document.body.className = `theme-dark mode-${mode}`;
        
        const leftPanel = document.getElementById('panel-left');

        if (mode === 'photo') {
            this.photoUI.activate();
            if (leftPanel) leftPanel.style.width = '';
        } else if (mode === 'enhance') {
            this.enhancementUI.activate();
            if (leftPanel) leftPanel.style.width = '';
        } else if (mode === 'aistudio') {
            if (this.currentMode === 'photo') this.photoUI.deactivate();
            if (this.currentMode === 'enhance') this.enhancementUI.deactivate();
            if (leftPanel) leftPanel.style.width = '380px';
            const aiTab = document.getElementById('tab-ai-studio');
            if (aiTab) {
                document.querySelectorAll('.panel-header .tab').forEach(t => t.classList.remove('active'));
                aiTab.classList.add('active');
                document.querySelectorAll('#panel-left .tab-pane').forEach(p => p.classList.remove('active'));
                const aiPane = document.getElementById('ai-studio-lib');
                if (aiPane) aiPane.classList.add('active');
            }
        } else {
            if (this.currentMode === 'photo') this.photoUI.deactivate();
            if (this.currentMode === 'enhance') this.enhancementUI.deactivate();
            if (leftPanel) leftPanel.style.width = '';
            const mediaTab = document.querySelector('.panel-header .tab[data-target="media-bin"]');
            if (mediaTab) {
                document.querySelectorAll('.panel-header .tab').forEach(t => t.classList.remove('active'));
                mediaTab.classList.add('active');
                document.querySelectorAll('#panel-left .tab-pane').forEach(p => p.classList.remove('active'));
                const mediaPane = document.getElementById('media-bin');
                if (mediaPane) mediaPane.classList.add('active');
            }
            // Standard editor
            if (leftPanel) leftPanel.style.width = '';
        }

        // Update active class on mode pills
        document.querySelectorAll('.mode-pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
        });
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
