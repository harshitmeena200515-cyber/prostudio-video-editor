/**
 * Shape rendering system
 * Renders primitive shapes for overlays
 */

export class ShapeEngine {
    
    renderShape(ctx, clip, time) {
        if (!clip.shapeData) return;
        const data = clip.shapeData;
        
        ctx.save();
        
        ctx.fillStyle = data.fillColor;
        if (data.strokeEnabled) {
            ctx.strokeStyle = data.strokeColor;
            ctx.lineWidth = data.strokeWidth;
        }
        
        ctx.beginPath();
        
        switch (data.type) {
            case 'rectangle':
                if (data.cornerRadius > 0) {
                    ctx.roundRect(-data.width/2, -data.height/2, data.width, data.height, data.cornerRadius);
                } else {
                    ctx.rect(-data.width/2, -data.height/2, data.width, data.height);
                }
                break;
                
            case 'circle':
                ctx.arc(0, 0, data.radius, 0, Math.PI * 2);
                break;
                
            case 'triangle':
                ctx.moveTo(0, -data.radius);
                ctx.lineTo(data.radius * 0.866, data.radius * 0.5);
                ctx.lineTo(-data.radius * 0.866, data.radius * 0.5);
                ctx.closePath();
                break;
        }
        
        ctx.fill();
        if (data.strokeEnabled) ctx.stroke();
        
        ctx.restore();
    }
}
