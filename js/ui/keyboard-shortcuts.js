/**
 * Keyboard Shortcuts
 */

export function initShortcuts(app) {
    document.addEventListener('keydown', (e) => {
        // Prevent shortcuts if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                app.togglePlayback();
                break;
            case 'KeyC':
                app.setTool('blade');
                break;
            case 'KeyV':
                app.setTool('selection');
                break;
            case 'KeyI':
                app.setInPoint();
                break;
            case 'KeyO':
                app.setOutPoint();
                break;
            case 'Backspace':
            case 'Delete':
                app.deleteSelected();
                break;
            case 'KeyZ':
                if (e.ctrlKey || e.metaKey) {
                    if (e.shiftKey) app.projectManager.redo();
                    else app.projectManager.undo();
                }
                break;
            case 'KeyS':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    app.projectManager.saveToStorage();
                }
                break;
        }
    });
}
