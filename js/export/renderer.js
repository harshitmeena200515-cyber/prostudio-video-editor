/**
 * Export Renderer Pipeline
 * Captures the canvas and audio context to output a final video file.
 * Uses MediaRecorder API for fast browser-based encoding.
 */

export class RendererPipeline {
    constructor(previewEngine, audioEngine) {
        this.preview = previewEngine;
        this.audio = audioEngine;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isExporting = false;
    }
    
    async startExport(options) {
        this.isExporting = true;
        this.recordedChunks = [];
        
        // Setup a hidden canvas for full-resolution rendering if needed
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = options.width || 1920;
        exportCanvas.height = options.height || 1080;
        
        const fps = options.fps || 30;
        const videoBitsPerSecond = options.bitrate || 8000000; // 8Mbps
        
        // Create video stream from canvas
        const videoStream = this.preview.canvas.captureStream(fps);
        
        // Create audio stream from audio engine
        const audioStreamDestination = this.audio.ctx.createMediaStreamDestination();
        this.audio.masterGain.connect(audioStreamDestination);
        const audioStream = audioStreamDestination.stream;
        
        // Combine streams
        const combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
        ]);
        
        const mimeType = options.format === 'webm' ? 'video/webm;codecs=vp9' : 'video/webm;codecs=h264';
        
        try {
            this.mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: mimeType,
                videoBitsPerSecond: videoBitsPerSecond
            });
            
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.recordedChunks.push(e.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.finalizeExport(options.format);
            };
            
            // Start simulation of playback for recording
            this.simulatePlaybackForExport();
            this.mediaRecorder.start();
            
        } catch (e) {
            console.error("Export failed setup:", e);
            alert("Export format not supported by this browser.");
            this.isExporting = false;
        }
    }
    
    simulatePlaybackForExport() {
        // In a real implementation, this would precisely clock the preview render
        // frame by frame offline, rather than real-time playback.
        // For MediaRecorder, we have to play it back in real time.
        document.dispatchEvent(new CustomEvent('timeline:play'));
        
        // Listen for end of timeline to stop recording
        // (Mocked timeout here)
        setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
                document.dispatchEvent(new CustomEvent('timeline:pause'));
            }
        }, 5000); // Stop after 5 seconds for demo
    }
    
    finalizeExport(format) {
        this.isExporting = false;
        
        const blob = new Blob(this.recordedChunks, {
            type: format === 'webm' ? 'video/webm' : 'video/mp4' // mp4 wrapper around h264 webm sometimes works
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = `ProStudio_Export_${Date.now()}.${format}`;
        a.click();
        
        window.URL.revokeObjectURL(url);
        
        alert("Export Complete!");
    }
}
