/**
 * UI Panel Management
 * Handles resizing panels and switching workspaces.
 */

export function initPanels() {
    const resizables = document.querySelectorAll('.resizable');
    
    // Simple drag to resize logic
    resizables.forEach(panel => {
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.style.position = 'absolute';
        handle.style.right = '0';
        handle.style.top = '0';
        handle.style.bottom = '0';
        handle.style.width = '4px';
        handle.style.cursor = 'col-resize';
        handle.style.zIndex = '100';
        
        panel.appendChild(handle);
        panel.style.position = 'relative';
        
        let isResizing = false;
        
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const rect = panel.getBoundingClientRect();
            let newWidth = e.clientX - rect.left;
            
            // Constrain
            if (newWidth < 200) newWidth = 200;
            if (newWidth > window.innerWidth * 0.4) newWidth = window.innerWidth * 0.4;
            
            panel.style.width = `${newWidth}px`;
            panel.style.flex = 'none';
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                // Trigger resize event for Canvas
                window.dispatchEvent(new Event('resize'));
            }
        });
    });
    
    // Tabs Logic
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            if (!targetId) return;
            
            // Deactivate siblings
            const parent = e.target.closest('.tabs');
            parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            // Show target pane
            const container = e.target.closest('.panel').querySelector('.panel-content');
            container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
    
    // Sub-Tabs Logic (Right Panel)
    const subTabs = document.querySelectorAll('.sub-tab');
    subTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const parent = e.target.closest('.sub-tabs');
            if (parent) {
                parent.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    });
    
    // Inner Sidebar Logic (Left Panel)
    const innerItems = document.querySelectorAll('.inner-sidebar-item');
    innerItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const parent = e.target.closest('.inner-sidebar');
            if (parent) {
                parent.querySelectorAll('.inner-sidebar-item').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    });
}
