/**
 * Sticker and Emoji Engine
 */

export class StickerEngine {
    constructor() {
        this.stickers = new Map();
    }
    
    // Load a custom image or animated GIF as a sticker
    async loadSticker(id, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.stickers.set(id, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        });
    }
    
    renderSticker(ctx, clip) {
        if (!clip.stickerData) return;
        const data = clip.stickerData;
        
        const img = this.stickers.get(data.stickerId);
        if (img) {
            ctx.save();
            // Draw image centered
            ctx.drawImage(img, -img.width/2, -img.height/2);
            ctx.restore();
        } else if (data.emoji) {
            // Render emoji as text
            ctx.save();
            ctx.font = `${data.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(data.emoji, 0, 0);
            ctx.restore();
        }
    }
}
