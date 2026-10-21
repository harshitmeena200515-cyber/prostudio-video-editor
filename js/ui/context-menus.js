/**
 * Custom Context Menus
 */

export function initContextMenus() {
    const menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.style.display = 'none';
    menu.style.position = 'absolute';
    menu.style.backgroundColor = 'var(--bg-panel-header)';
    menu.style.border = '1px solid var(--border-light)';
    menu.style.borderRadius = 'var(--radius-md)';
    menu.style.padding = '4px 0';
    menu.style.zIndex = '1000';
    menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    menu.style.minWidth = '150px';
    
    document.body.appendChild(menu);
    
    // Hide menu on click outside
    document.addEventListener('click', () => {
        menu.style.display = 'none';
    });
    
    // Custom context menu for timeline track area
    const tracksArea = document.querySelector('.tracks-area');
    if (tracksArea) {
        tracksArea.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            menu.innerHTML = `
                <div class="menu-action" data-action="add-video-track" style="padding: 6px 12px; cursor: pointer; font-size: 12px;">Add Video Track</div>
                <div class="menu-action" data-action="add-audio-track" style="padding: 6px 12px; cursor: pointer; font-size: 12px;">Add Audio Track</div>
                <div style="height: 1px; background: var(--border-light); margin: 4px 0;"></div>
                <div class="menu-action" data-action="paste" style="padding: 6px 12px; cursor: pointer; font-size: 12px;">Paste</div>
            `;
            
            menu.style.left = `${e.clientX}px`;
            menu.style.top = `${e.clientY}px`;
            menu.style.display = 'block';
            
            // Add hover effects
            menu.querySelectorAll('.menu-action').forEach(item => {
                item.addEventListener('mouseenter', () => item.style.backgroundColor = 'var(--accent-color)');
                item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');
                
                item.addEventListener('click', (ev) => {
                    const action = ev.target.getAttribute('data-action');
                    console.log(`Context action: ${action}`);
                    // Execute action via main app
                });
            });
        });
    }
}
