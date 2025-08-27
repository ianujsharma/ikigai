function loadCanvasPage() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'canvas-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    modal.innerHTML = `
        <div style="
            width: 90%;
            height: 90%;
            background: var(--bg-color);
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        ">
            <button onclick="closeCanvasModal()" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                z-index: 1001;
            ">×</button>
            <iframe id="canvas-iframe" src="dusk/editor/editor.html" style="
                width: 100%;
                height: 100%;
                border: none;
                border-radius: 10px;
            "></iframe>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeCanvasModal() {
    const modal = document.getElementById('canvas-modal');
    if (modal) {
        modal.remove();
    }
}