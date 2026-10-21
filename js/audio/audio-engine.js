/**
 * Web Audio API Engine
 * Handles mixing audio tracks, applying effects (EQ, compressor),
 * volume automation, and waveform generation.
 */

export class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        
        // Track nodes
        this.trackNodes = new Map();
        
        // Base Effects
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.connect(this.masterGain);
        
        // Expanded Audio Effects Registry (Parameters will map to WebAudio Nodes)
        this.audioEffects = {
            echo: { id: 'echo', name: 'Echo', params: { delayTime: 0.5, feedback: 0.5 } },
            reverb: { id: 'reverb', name: 'Reverb', params: { roomSize: 0.8, dampening: 0.5 } },
            bassBoost: { id: 'bassBoost', name: 'Bass Boost', params: { frequency: 100, gain: 10 } },
            robotVoice: { id: 'robotVoice', name: 'Robot Voice', params: { pitch: 1.0 } },
            monsterVoice: { id: 'monsterVoice', name: 'Monster Voice', params: { pitchDown: -5 } },
            chipmunkVoice: { id: 'chipmunkVoice', name: 'Chipmunk Voice', params: { pitchUp: 5 } },
            deepVoice: { id: 'deepVoice', name: 'Deep Voice', params: { pitchDown: -2 } },
            telephone: { id: 'telephone', name: 'Telephone Effect', params: { bandpassFreq: 1500 } },
            radio: { id: 'radio', name: 'Radio Effect', params: { noise: 0.2, distortion: 0.5 } },
            noiseReduction: { id: 'noiseReduction', name: 'Noise Reduction', params: { threshold: -50 } }
        };
        
        // For rendering waveforms
        this.analyser = this.ctx.createAnalyser();
        this.masterGain.connect(this.analyser);
    }
    
    initTrack(trackId) {
        const gainNode = this.ctx.createGain();
        const pannerNode = this.ctx.createStereoPanner();
        
        gainNode.connect(pannerNode);
        pannerNode.connect(this.compressor);
        
        this.trackNodes.set(trackId, {
            gain: gainNode,
            panner: pannerNode,
            sources: [] // active audio buffer sources
        });
    }
    
    setMasterVolume(value) { // 0.0 to 1.0
        this.masterGain.gain.setValueAtTime(value, this.ctx.currentTime);
    }
    
    setTrackVolume(trackId, value) {
        const track = this.trackNodes.get(trackId);
        if (track) {
            track.gain.gain.setValueAtTime(value, this.ctx.currentTime);
        }
    }
    
    // Generates a waveform SVG or Canvas path for the UI
    async generateWaveform(fileUrl) {
        try {
            const response = await fetch(fileUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            
            const rawData = audioBuffer.getChannelData(0); // Only use first channel for display
            const samples = 1000; // Number of bars to draw
            const blockSize = Math.floor(rawData.length / samples);
            const filteredData = [];
            
            for (let i = 0; i < samples; i++) {
                let blockStart = blockSize * i;
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum = sum + Math.abs(rawData[blockStart + j]);
                }
                filteredData.push(sum / blockSize);
            }
            
            return filteredData; // Array of amplitudes
        } catch (e) {
            console.error("Failed to generate waveform", e);
            return [];
        }
    }
    
    playClip(buffer, startOffset = 0) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.masterGain); // Connect to a track node normally
        source.start(0, startOffset);
        return source;
    }
    
    suspend() {
        this.ctx.suspend();
    }
    
    resume() {
        this.ctx.resume();
    }
}
