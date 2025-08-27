// message.js - Complete Client Side Implementation

// Handle keyboard events
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Enhanced sendMessage function with streaming support
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isTyping) return;

    addMessage('user', message);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    showTypingIndicator();
    
    try {
        // Add assistant message placeholder for streaming
        addMessage('assistant', '...');
        const messageIndex = currentMessages.length - 1;
        
        // Get the response stream
        const response = await sendToBackend(message);
        
        // Process the stream
        const result = await handleStreamedResponse(response, messageIndex);
        
        // Update activeChatId if we got a chat name
        if (result.chatName) {
            activeChatId = result.chatName;
        }
        
        // Save and update UI
        saveChatToHistory();
        
    } catch (error) {
        console.error('Error sending message:', error);
        hideTypingIndicator();
        updateAssistantMessage(
            currentMessages.length - 1,
            "Sorry, I encountered an error. Please try again."
        );
    } finally {
        hideTypingIndicator();
    }
}

// Add message to chat with enhanced formatting
function addMessage(sender, content) {
    const emptyState = chatContainer.querySelector('.empty-state');
    
    if (emptyState) {
        emptyState.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const formattedContent = formatMessageContent(content);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${sender === 'user' ? 'You' : 'AI'}</div>
        <div class="message-content">
            <div class="message-text">${formattedContent}</div>
            ${sender === 'assistant' ? `
                <div class="message-actions">
                    <button class="action-btn" onclick="likeMessage(this)" title="Like this response">
                        <span>👍</span> 
                    </button>
                    <button class="action-btn" onclick="dislikeMessage(this)" title="Dislike this response">
                        <span>👎</span> 
                    </button>
                    <button class="action-btn" onclick="retryMessage(this)" title="Regenerate response">
                        <span>🔄</span> Retry
                    </button>
                    <button class="action-btn" onclick="editMessage(this)" title="Edit this message">
                        <span>✏️</span> Edit
                    </button>
                    <button class="action-btn" onclick="openCopySearchBox(this)" title="Copy to Canvas">
                        <span>📋</span> Copy to Canvas
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    let messageContainer = chatContainer.querySelector('.message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        chatContainer.appendChild(messageContainer);
    }
    
    messageContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    currentMessages.push({ 
        sender, 
        content,
        element: messageDiv,
        formattedContent
    });
}

// Enhanced message content formatting with better markdown support
function formatMessageContent(content) {
    let formatted = content;
    
    // Handle code blocks first (to prevent interference with other formatting)
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Handle inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle blockquotes
    formatted = formatted.replace(/^>\s(.*$)/gm, '<blockquote>$1</blockquote>');
    
    // Handle links
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Handle line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// Render all messages with improved error handling
function renderMessages() {
    chatContainer.innerHTML = '';
    
    if (currentMessages.length === 0) {
        chatContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✨</div>
                <h2>Dust AI</h2>
                <p>Start a conversation by typing your message below. I can help with creative ideas, problem solving, and much more.</p>
            </div>
        `;
        return;
    }
    
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    chatContainer.appendChild(messageContainer);
    
    currentMessages.forEach((msg, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender}`;
        messageDiv.dataset.messageIndex = index;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${msg.sender === 'user' ? 'You' : 'AI'}</div>
            <div class="message-content">
                <div class="message-text">${msg.formattedContent || formatMessageContent(msg.content)}</div>
                ${msg.sender === 'assistant' ? `
                    <div class="message-actions">
                        <button class="action-btn" onclick="likeMessage(this)" title="Like this response">
                            <span>👍</span> 
                        </button>
                        <button class="action-btn" onclick="dislikeMessage(this)" title="Dislike this response">
                            <span>👎</span> 
                        </button>
                        <button class="action-btn" onclick="retryMessage(this)" title="Regenerate response">
                            <span>🔄</span> Retry
                        </button>
                        <button class="action-btn" onclick="editMessage(this)" title="Edit this message">
                            <span>✏️</span> Edit
                        </button>
                        <button class="action-btn" onclick="openCopySearchBox(this)" title="Copy to Canvas">
                            <span>📋</span> Copy to Canvas
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        messageContainer.appendChild(messageDiv);
        msg.element = messageDiv;
    });
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Enhanced typing indicator
function showTypingIndicator() {
    isTyping = true;
    sendBtn.disabled = true;
    
    const messageContainer = chatContainer.querySelector('.message-container') || document.createElement('div');
    messageContainer.className = 'message-container';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">AI</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <span class="typing-text">Dust is thinking...</span>
            </div>
        </div>
    `;
    
    if (!chatContainer.querySelector('.message-container')) {
        chatContainer.appendChild(messageContainer);
    }
    messageContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    isTyping = false;
    sendBtn.disabled = false;
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Message action functions with server integration

async function likeMessage(btn) {
    btn.classList.toggle('liked');
    const dislikeBtn = btn.parentElement.querySelector('.action-btn:nth-child(2)');
    dislikeBtn.classList.remove('disliked');
    
    // Send to server
    if (activeChatId) {
        const messageElement = btn.closest('.message');
        const messageIndex = parseInt(messageElement.dataset.messageIndex) || 
                            Array.from(messageElement.parentElement.children).indexOf(messageElement);
        
        try {
            const response = await fetch(Server_ip + `/chat/${activeChatId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_index: messageIndex })
            });
            
            const result = await response.json();
            if (!result.success) {
                console.warn('Failed to save like to server');
                // Revert the UI change if server failed
                btn.classList.toggle('liked');
            }
        } catch (error) {
            console.error('Error liking message:', error);
            // Revert the UI change if server failed
            btn.classList.toggle('liked');
        }
    }
}

async function dislikeMessage(btn) {
    btn.classList.toggle('disliked');
    const likeBtn = btn.parentElement.querySelector('.action-btn:nth-child(1)');
    likeBtn.classList.remove('liked');
    
    // Send to server
    if (activeChatId) {
        const messageElement = btn.closest('.message');
        const messageIndex = parseInt(messageElement.dataset.messageIndex) || 
                            Array.from(messageElement.parentElement.children).indexOf(messageElement);
        
        try {
            const response = await fetch(Server_ip + `/chat/${activeChatId}/dislike`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_index: messageIndex })
            });
            
            const result = await response.json();
            if (!result.success) {
                console.warn('Failed to save dislike to server');
                // Revert the UI change if server failed
                btn.classList.toggle('disliked');
            }
        } catch (error) {
            console.error('Error disliking message:', error);
            // Revert the UI change if server failed
            btn.classList.toggle('disliked');
        }
    }
}

async function retryMessage(btn) {
    if (!activeChatId) return;
    
    const messageElement = btn.closest('.message');
    const messageIndex = parseInt(messageElement.dataset.messageIndex) || 
                        Array.from(messageElement.parentElement.children).indexOf(messageElement);
    
    // Show loading state
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> Regenerating...';
    btn.disabled = true;
    
    try {
        const response = await fetch(Server_ip + `/chat/${activeChatId}/regenerate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message_index: messageIndex })
        });
        
        const result = await response.json();
        
        if (result.success && result.new_response) {
            // Update the message content
            const messageText = messageElement.querySelector('.message-text');
            const newFormattedContent = formatMessageContent(result.new_response);
            messageText.innerHTML = newFormattedContent;
            
            // Update the currentMessages array
            if (currentMessages[messageIndex]) {
                currentMessages[messageIndex].content = result.new_response;
                currentMessages[messageIndex].formattedContent = newFormattedContent;
            }
            
            // Show success briefly
            btn.innerHTML = '<span>✅</span> Regenerated';
            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }, 2000);
        } else {
            throw new Error('Failed to regenerate response');
        }
    } catch (error) {
        console.error('Error regenerating message:', error);
        btn.innerHTML = '<span>❌</span> Failed';
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }, 2000);
    }
}

async function editMessage(btn) {
    const messageElement = btn.closest('.message');
    const messageText = messageElement.querySelector('.message-text');
    const messageIndex = parseInt(messageElement.dataset.messageIndex) || 
                        Array.from(messageElement.parentElement.children).indexOf(messageElement);
    
    // Get the original content (unformatted)
    const originalContent = currentMessages[messageIndex]?.content || messageText.textContent;
    
    // Create edit interface
    const editContainer = document.createElement('div');
    editContainer.className = 'message-edit-container';
    editContainer.innerHTML = `
        <textarea class="message-edit-textarea">${originalContent}</textarea>
        <div class="message-edit-actions">
            <button class="edit-save-btn" onclick="saveMessageEdit(this, ${messageIndex})">Save</button>
            <button class="edit-cancel-btn" onclick="cancelMessageEdit(this)">Cancel</button>
        </div>
    `;
    
    // Replace message content with edit interface
    messageText.style.display = 'none';
    messageText.parentNode.insertBefore(editContainer, messageText.nextSibling);
    
    // Focus the textarea
    const textarea = editContainer.querySelector('.message-edit-textarea');
    textarea.focus();
    
    // Auto-resize textarea
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
}

async function saveMessageEdit(btn, messageIndex) {
    const editContainer = btn.closest('.message-edit-container');
    const textarea = editContainer.querySelector('.message-edit-textarea');
    const newContent = textarea.value.trim();
    
    if (!newContent) return;
    
    const messageElement = editContainer.closest('.message');
    const messageText = messageElement.querySelector('.message-text');
    
    // Show saving state
    btn.innerHTML = 'Saving...';
    btn.disabled = true;
    
    try {
        if (activeChatId) {
            // Send to server
            const response = await fetch(Server_ip + `/chat/${activeChatId}/message/${messageIndex}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent })
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error('Failed to save edit to server');
            }
        }
        
        // Update local content
        const formattedContent = formatMessageContent(newContent);
        messageText.innerHTML = formattedContent;
        
        // Update currentMessages array
        if (currentMessages[messageIndex]) {
            currentMessages[messageIndex].content = newContent;
            currentMessages[messageIndex].formattedContent = formattedContent;
        }
        
        // Remove edit interface
        messageText.style.display = '';
        editContainer.remove();
        
    } catch (error) {
        console.error('Error saving message edit:', error);
        btn.innerHTML = 'Error - Try Again';
        btn.disabled = false;
    }
}

function cancelMessageEdit(btn) {
    const editContainer = btn.closest('.message-edit-container');
    const messageText = editContainer.parentNode.querySelector('.message-text');
    
    // Restore original display
    messageText.style.display = '';
    editContainer.remove();
}

// Copy message content to clipboard (bonus feature)
async function copyMessage(btn) {
    const messageElement = btn.closest('.message');
    const messageIndex = parseInt(messageElement.dataset.messageIndex) || 
                        Array.from(messageElement.parentElement.children).indexOf(messageElement);
    
    const content = currentMessages[messageIndex]?.content || messageElement.querySelector('.message-text').textContent;
    
    try {
        await navigator.clipboard.writeText(content);
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span>✅</span> Copied';
        setTimeout(() => {
            btn.innerHTML = originalContent;
        }, 2000);
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span>✅</span> Copied';
        setTimeout(() => {
            btn.innerHTML = originalContent;
        }, 2000);
    }
}

// Auto-resize message input
function autoResizeInput() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
}

// Initialize message input event listeners
if (typeof messageInput !== 'undefined' && messageInput) {
    messageInput.addEventListener('input', autoResizeInput);
    messageInput.addEventListener('keydown', handleKeyDown);
}

// Utility function to scroll to bottom smoothly
function scrollToBottom(smooth = true) {
    if (smooth) {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    } else {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Export functions for global access
window.messageActions = {
    sendMessage,
    addMessage,
    formatMessageContent,
    renderMessages,
    showTypingIndicator,
    hideTypingIndicator,
    likeMessage,
    dislikeMessage,
    retryMessage,
    editMessage,
    copyMessage,
    scrollToBottom
};