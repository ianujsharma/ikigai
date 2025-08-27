// Canvas Memory System (canvas.js) - Updated to align with server implementation

let canvasMemory = {
    exports: [],
    currentSession: {
        content: '',
        lastSaved: null,
        stats: { messages: 0, words: 0, chars: 0 }
    }
};

// Canvas functions with memory and server integration
function toggleCanvas() {
    isCanvasOpen = !isCanvasOpen;
    
    if (isCanvasOpen) {
        canvasPanel.classList.add('open');
        mainContent.classList.add('with-canvas');
        toggleCanvasBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 5v2h-6V5h6zm0 4v2h-6V9h6zm0 4v2h6v-2h6zM5 5v2h2V5H5zm0 4v2h2V9H5zm0 4v2h2v-2H5z"/>
            </svg>
        `;
        // Load current session content from server
        loadCanvasFromServer();
    } else {
        canvasPanel.classList.remove('open');
        mainContent.classList.remove('with-canvas');
        toggleCanvasBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 5v2h6V5H9zm0 4v2h6V9H9zm0 4v2h6v-2H9zM5 5v2h2V5H5zm0 4v2h2V9H5zm0 4v2h2v-2H5z"/>
            </svg>
        `;
        // Auto-save when closing
        saveCurrentSession();
    }
}

// Load canvas content from server - aligned with server response format
async function loadCanvasFromServer() {
    try {
        const response = await fetch('https://srv975554.hstgr.cloud/canvas', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.canvas_data && Array.isArray(data.canvas_data)) {
                // Process canvas data according to server format
                const content = data.canvas_data
                    .map(item => {
                        // Handle different content formats from server
                        if (typeof item.content === 'string') {
                            return item.content;
                        }
                        return item.query || '';
                    })
                    .filter(content => content.trim())
                    .join('\n\n');
                    
                if (canvasContent) {
                    canvasContent.value = content;
                    canvasMemory.currentSession.content = content;
                    updateCanvasStats();
                }
            } else {
                // Handle empty canvas or failed response
                if (canvasContent) {
                    canvasContent.value = '';
                    canvasMemory.currentSession.content = '';
                    updateCanvasStats();
                }
            }
        }
    } catch (error) {
        console.error('Error loading canvas from server:', error);
        // Fallback to local memory if server fails
        if (canvasMemory.currentSession.content && canvasContent) {
            canvasContent.value = canvasMemory.currentSession.content;
            updateCanvasStats();
        }
    }
}

function saveCurrentSession() {
    if (!canvasContent) return;
    
    canvasMemory.currentSession.content = canvasContent.value;
    canvasMemory.currentSession.lastSaved = new Date().toISOString();
    canvasMemory.currentSession.stats = getCurrentStats();
    
    // Optional: Auto-sync with server periodically
    // syncCanvasWithServer();
}

function getCurrentStats() {
    if (!canvasContent) return { messages: 0, words: 0, chars: 0 };
    
    const content = canvasContent.value;
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;
    const messageCount = content.trim() ? content.split(/\n{2,}/).length : 0;
    
    return { messages: messageCount, words: wordCount, chars: charCount };
}

function openCopySearchBox(btn) {
    currentCopyingMessage = btn.closest('.message');
    copySearchInput.value = ''; // Empty by default - let user specify action
    copySearchBox.classList.add('open');
    copySearchInput.focus();
}

function closeCopySearchBox() {
    copySearchBox.classList.remove('open');
    currentCopyingMessage = null;
}

// Updated to match server endpoint expectations
async function confirmCopyToCanvas() {
    if (!currentCopyingMessage) return;
    
    const messageContent = currentCopyingMessage.querySelector('.message-text').textContent;
    const action = copySearchInput.value.trim() || ''; // Send empty string if no action
    
    // Show loading state
    const copyBtn = currentCopyingMessage.querySelector('.message-actions button:nth-child(5)');
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<span>⏳</span> Processing...';
    copyBtn.disabled = true;
    closeCopySearchBox();

    try {
        // Send only the action to server - no mode
        const response = await fetch('https://srv975554.hstgr.cloud/canvas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: messageContent,
                action: action  // Only send the user's action
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            await loadCanvasFromServer();
            copyBtn.innerHTML = '<span>✅</span> Added to Canvas';
            
            if (!isCanvasOpen) {
                toggleCanvas();
            }
        } else {
            throw new Error(result.error || 'Failed to process canvas request');
        }
        
    } catch (error) {
        console.error('Error copying to canvas:', error);
        copyBtn.innerHTML = '<span>❌</span> Failed';
        alert('Failed to copy to canvas: ' + error.message);
    } finally {
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.disabled = false;
        }, 2000);
        
       
    }
}

// Updated to match server clear endpoint
function clearCanvas() {
    if (confirm('Are you sure you want to clear the canvas?')) {
        // Clear locally first for immediate feedback
        if (canvasContent) {
            canvasContent.value = '';
            canvasMemory.currentSession.content = '';
            updateCanvasStats();
        }
        
        // Also clear on server
        clearCanvasOnServer();
    }
}

async function clearCanvasOnServer() {
    try {
        const response = await fetch('https://srv975554.hstgr.cloud/canvas/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('Canvas cleared on server');
            } else {
                console.warn('Failed to clear canvas on server:', result.message);
            }
        } else {
            console.warn('Failed to clear canvas on server - HTTP error:', response.status);
        }
    } catch (error) {
        console.error('Error clearing canvas on server:', error);
    }
}

function copyAllCanvas() {
    const content = canvasContent.value;
    
    if (!content.trim()) {
        alert('Canvas is empty!');
        return;
    }
    
    navigator.clipboard.writeText(content).then(() => {
        showCanvasButtonFeedback('.toolbar-btn:nth-child(2)', '✅ Copied');
    }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showCanvasButtonFeedback('.toolbar-btn:nth-child(2)', '✅ Copied');
    });
}

// Updated export function to match server export endpoint
async function exportCanvas() {
    const content = canvasContent.value;
    
    if (!content.trim()) {
        alert('Canvas is empty! Nothing to export.');
        return;
    }
    
    const timestamp = new Date().toISOString();
    const baseFilename = 'canvas-export-' + timestamp.slice(0, 10);
    
    // Show loading state
    const exportBtn = document.querySelector('.toolbar-btn:nth-child(3)');
    const originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = '<span>⏳</span> Exporting...';
    exportBtn.disabled = true;
    
    try {
        // Generate educated title from content
        const educatedTitle = generateEducatedTitle(content);
        
        // Check if export with same base name exists to determine version
        const version = await getNextVersion(baseFilename);
        const finalFilename = `${baseFilename}-v${version}.json`;
        
        // Create export data in your specified format
        const exportData = {
            "id": generateUUID(),
            "title": educatedTitle,
            "update": version,
            "keyword": [], // Empty as specified
            "plain_text": content,
            "text": content, // Same content as plain_text
            "created_at": timestamp,
            "updated_at": timestamp
        };
        
        // Save to local memory
        canvasMemory.exports.push(exportData);
        
        // Limit memory to last 50 exports
        if (canvasMemory.exports.length > 50) {
            canvasMemory.exports = canvasMemory.exports.slice(-50);
        }
        
        // Ask user about server backup
        const shouldSaveToServer = confirm('Do you want to save this export to the server database as well?');
        
        if (shouldSaveToServer) {
            try {
                const response = await fetch('https://srv975554.hstgr.cloud/canvas/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: JSON.stringify(exportData, null, 2), // Send formatted JSON
                        filename: finalFilename,
                        type: 'canvas_export_structured',
                        metadata: {
                            format: 'structured_json',
                            version: version,
                            title: educatedTitle
                        }
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        console.log('Structured export saved to server with ID:', result.export_id);
                        exportData.serverId = result.export_id;
                    }
                }
            } catch (serverError) {
                console.error('Server export error:', serverError);
            }
        }
        
        // Create and download JSON file
        const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        URL.revokeObjectURL(url);
        
        // Show success
        exportBtn.innerHTML = '<span>✅</span> Exported';
        console.log('Structured export saved:', exportData);
        
    } catch (error) {
        console.error('Error exporting canvas:', error);
        exportBtn.innerHTML = '<span>❌</span> Failed';
        alert('Failed to export canvas: ' + error.message);
    } finally {
        // Reset button
        setTimeout(() => {
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
        }, 2000);
    }
}
// Generate educated title from canvas content
function generateEducatedTitle(content) {
    if (!content || !content.trim()) {
        return "Untitled Canvas Export";
    }
    
    const lines = content.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
        return "Empty Canvas Export";
    }
    
    // Try to get the first meaningful line
    const firstLine = lines[0].trim();
    
    // Remove common prefixes and clean up
    const cleanTitle = firstLine
        .replace(/^(##+\s*|[-*•]\s*|Note:\s*|Summary:\s*)/i, '') // Remove markdown headers, bullets, etc.
        .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
        .trim();
    
    if (cleanTitle.length > 50) {
        return cleanTitle.substring(0, 47) + "...";
    }
    
    if (cleanTitle.length > 0) {
        return cleanTitle;
    }
    
    // Fallback: generate based on content type
    const wordCount = content.split(/\s+/).length;
    const hasCode = content.includes('```') || content.includes('function') || content.includes('class');
    const hasList = content.includes('- ') || content.includes('* ') || /^\d+\./m.test(content);
    
    if (hasCode) return `Code Notes (${wordCount} words)`;
    if (hasList) return `List Notes (${wordCount} words)`;
    return `Canvas Notes (${wordCount} words)`;
}

// Generate UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Get next version number for exports with same base name
async function getNextVersion(baseName) {
    // Check local memory first
    const existingExports = canvasMemory.exports.filter(exp => 
        exp.title && exp.title.includes(baseName.split('-')[2]) // Check date part
    );
    
    if (existingExports.length === 0) {
        return 1;
    }
    
    // Find highest version number
    const maxVersion = Math.max(...existingExports.map(exp => exp.update || 1));
    return maxVersion + 1;
}


function updateCanvasStats() {
    if (!canvasContent) return;
    
    const stats = getCurrentStats();
    
    const collectedElement = document.getElementById('collectedCount');
    const wordElement = document.getElementById('wordCount');
    const charElement = document.getElementById('charCount');
    
    if (collectedElement) collectedElement.textContent = `${stats.messages} messages`;
    if (wordElement) wordElement.textContent = `${stats.words} words`;
    if (charElement) charElement.textContent = `${stats.chars} chars`;
}

// Utility function for button feedback
function showCanvasButtonFeedback(selector, message) {
    const button = document.querySelector(selector);
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = `<span>${message}</span>`;
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    }
}

// Memory management functions (enhanced to work with server)
function getExportHistory() {
    return canvasMemory.exports;
}

function getExportById(id) {
    return canvasMemory.exports.find(exp => exp.id === id);
}

function loadExportContent(id) {
    const exportData = getExportById(id);
    if (exportData && canvasContent) {
        canvasContent.value = exportData.content;
        canvasMemory.currentSession.content = exportData.content;
        updateCanvasStats();
        return true;
    }
    return false;
}

function deleteExportFromMemory(id) {
    const index = canvasMemory.exports.findIndex(exp => exp.id === id);
    if (index !== -1) {
        canvasMemory.exports.splice(index, 1);
        return true;
    }
    return false;
}

function clearExportHistory() {
    if (confirm('Are you sure you want to clear all export history?')) {
        canvasMemory.exports = [];
        return true;
    }
    return false;
}

function getMemoryStats() {
    return {
        totalExports: canvasMemory.exports.length,
        totalSize: canvasMemory.exports.reduce((sum, exp) => sum + exp.content.length, 0),
        lastExport: canvasMemory.exports.length > 0 ? canvasMemory.exports[canvasMemory.exports.length - 1].timestamp : null,
        currentSession: canvasMemory.currentSession,
        serverSyncStatus: 'available' // Could be enhanced to check actual server status
    };
}

// Enhanced server sync functionality - matching server sync endpoint
async function syncCanvasWithServer() {
    if (!canvasContent || !canvasMemory.currentSession.content) return false;
    
    try {
        const response = await fetch('https://srv975554.hstgr.cloud/canvas/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: canvasMemory.currentSession.content,
                stats: canvasMemory.currentSession.stats,
                lastSaved: canvasMemory.currentSession.lastSaved
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('Canvas synced with server at:', result.server_timestamp);
                return true;
            } else {
                console.warn('Server sync failed:', result.error);
                return false;
            }
        } else {
            console.warn('Server sync HTTP error:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error syncing canvas with server:', error);
        return false;
    }
}

// Auto-save functionality with debouncing
let saveTimeout;
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveCurrentSession();
        // Optional: sync with server less frequently
        if (Math.random() < 0.1) { // 10% chance to sync on each save
            syncCanvasWithServer();
        }
    }, 2000);
}

// Auto-save current session every 30 seconds
const autoSaveInterval = setInterval(() => {
    if (canvasContent && canvasContent.value !== canvasMemory.currentSession.content) {
        saveCurrentSession();
    }
}, 30000);

// Initialize canvas event listeners
function initializeCanvasListeners() {
    if (typeof canvasContent !== 'undefined' && canvasContent) {
        canvasContent.addEventListener('input', debouncedSave);
        canvasContent.addEventListener('blur', saveCurrentSession);
        
        // Load initial content when canvas is available
        loadCanvasFromServer();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCanvasListeners);
} else {
    initializeCanvasListeners();
}

// Enhanced search functionality for copy action - aligned with server actions
function setupCopySearchBox() {
    if (typeof copySearchInput !== 'undefined' && copySearchInput) {
        // Actions that user can specify (not modes)
        const userActions = ['summarize', 'extract_key_points', 'format', 'quote', 'clean', 'bullet_points'];
        
        // Create datalist for action suggestions
        const datalist = document.createElement('datalist');
        datalist.id = 'canvas-actions';
        
        userActions.forEach(action => {
            const option = document.createElement('option');
            option.value = action;
            datalist.appendChild(option);
        });
        
        document.body.appendChild(datalist);
        copySearchInput.setAttribute('list', 'canvas-actions');
        copySearchInput.placeholder = 'Enter action (e.g., summarize, format)';
        
        copySearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmCopyToCanvas();
            } else if (e.key === 'Escape') {
                closeCopySearchBox();
            }
        });
    }
}

// Initialize search box when available
setupCopySearchBox();

// Cleanup function
function cleanupCanvas() {
    if (saveTimeout) clearTimeout(saveTimeout);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
}

// Cleanup on page unload with final sync
window.addEventListener('beforeunload', () => {
    saveCurrentSession();
    // Attempt final sync (non-blocking)
    syncCanvasWithServer().catch(() => {}); // Ignore errors on page unload
    cleanupCanvas();
});

// Enhanced API aligned with server capabilities
window.canvasMemory = {
    // Data access
    getHistory: getExportHistory,
    getById: getExportById,
    loadContent: loadExportContent,
    deleteExport: deleteExportFromMemory,
    clearHistory: clearExportHistory,
    getStats: getMemoryStats,
    data: canvasMemory,
    
    // Server sync
    sync: syncCanvasWithServer,
    loadFromServer: loadCanvasFromServer,
    clearOnServer: clearCanvasOnServer,
    
    // Canvas operations
    clear: clearCanvas,
    export: exportCanvas,
    copyAll: copyAllCanvas,
    
    // Session management
    save: saveCurrentSession,
    cleanup: cleanupCanvas,
    
    // Status
    isServerAvailable: async () => {
        try {
            const response = await fetch('https://srv975554.hstgr.cloud/canvas', { method: 'GET' });
            return response.ok;
        } catch {
            return false;
        }
    }
};

// Enhanced content processing function (from original code, simplified)
function processCanvasContent(chatText, searchText, note) {
    let result = chatText;
    if (note && note.trim()) { 
        result += `\n\n[Note: ${note}]`;
    }
    return result;
}