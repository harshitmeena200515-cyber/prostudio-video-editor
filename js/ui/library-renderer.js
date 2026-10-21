/**
 * UI Library Renderer
 * Populates the Effects, Filters, and Transitions tabs with dynamic data.
 */

import { videoEffects, colorFilters, aiEffects, basicTransitions } from '../effects/index.js';

export function renderLibrary() {
    renderGrid('effects-grid', videoEffects, '✨');
    renderGrid('filters-grid', colorFilters, '🎨');
    renderGrid('transitions-grid', basicTransitions, '🪄');
}

function renderGrid(containerId, dataArray, icon) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = ''; // Clear empty state
    
    dataArray.forEach(item => {
        const card = document.createElement('div');
        card.className = 'library-card';
        card.dataset.id = item.id;
        
        card.innerHTML = `
            <div class="library-card-thumb">${icon}</div>
            <div class="library-card-name">${item.name}</div>
        `;
        
        // Add click handler to apply or preview effect
        card.addEventListener('click', () => {
            // Remove active from peers
            container.querySelectorAll('.library-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            // TODO: Dispatch event to app.js to apply this effect to the selected clip
            console.log(`Selected: ${item.name} (${item.id})`);
            
            // Visual feedback
            const thumb = card.querySelector('.library-card-thumb');
            const oldContent = thumb.innerHTML;
            thumb.innerHTML = '✔️';
            setTimeout(() => thumb.innerHTML = oldContent, 500);
        });
        
        container.appendChild(card);
    });
}
