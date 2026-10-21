/**
 * Text Engine
 * Expanded to include all requested text animations and styles.
 */

export class TextEngine {
    constructor() {
        this.fonts = [
            'Inter', 'JetBrains Mono', 'Roboto', 'Oswald', 'Montserrat', 
            'Playfair Display', 'Bebas Neue', 'Pacifico'
        ];
        
        // Expanded text animations
        this.animationPresets = {
            typewriter: { id: 'typewriter', name: 'Typewriter' },
            fadeText: { id: 'fadeText', name: 'Fade Text' },
            bounceText: { id: 'bounceText', name: 'Bounce Text' },
            popUp: { id: 'popUp', name: 'Pop Up' },
            slideText: { id: 'slideText', name: 'Slide Text' },
            zoomText: { id: 'zoomText', name: 'Zoom Text' },
            neonText: { id: 'neonText', name: 'Neon Text' },
            glitchText: { id: 'glitchText', name: 'Glitch Text' },
            threeDText: { id: '3dText', name: '3D Text' },
            kineticTypography: { id: 'kinetic', name: 'Kinetic Typography' },
            autoCaptions: { id: 'autoCaptions', name: 'Auto Captions' } // Special AI text type
        };
    }
    
    /**
     * Renders text onto a 2D Canvas context based on clip properties
     */
    renderText(ctx, clip, time) {
        if (!clip.textData) return;
        const data = clip.textData;
        
        ctx.save();
        
        ctx.font = `${data.italic ? 'italic ' : ''}${data.bold ? 'bold ' : ''}${data.size}px ${data.fontFamily}`;
        ctx.textAlign = data.align || 'center';
        ctx.textBaseline = 'middle';
        
        // Setup shadow
        if (data.shadow && data.shadow.enabled) {
            ctx.shadowColor = data.shadow.color;
            ctx.shadowBlur = data.shadow.blur;
            ctx.shadowOffsetX = data.shadow.offsetX;
            ctx.shadowOffsetY = data.shadow.offsetY;
        }
        
        let renderText = data.content;
        let opacity = 1.0;
        
        // Very basic mock of animations
        if (data.animation === 'typewriter') {
            const localTime = time - clip.startAt;
            const charsToShow = Math.floor(localTime * (data.animationSpeed || 10));
            renderText = data.content.substring(0, Math.min(charsToShow, data.content.length));
        } else if (data.animation === 'fadeText') {
            const localTime = time - clip.startAt;
            opacity = Math.min(1.0, localTime / 1.0);
            ctx.globalAlpha *= opacity;
        }
        
        ctx.fillStyle = data.color;
        ctx.fillText(renderText, 0, 0);
        
        if (data.stroke && data.stroke.enabled) {
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = data.stroke.color;
            ctx.lineWidth = data.stroke.width;
            ctx.strokeText(renderText, 0, 0);
        }
        
        ctx.restore();
    }
}
