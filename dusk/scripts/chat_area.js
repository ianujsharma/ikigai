//  chat_area.js
// Chat History Management 

async function loadChatHistory() {
    try {
        const response = await fetch('http://srv975554.hstgr.cloud:5000/chats');
        const data = await response.json();
        const savedChats = data.chats || [];
        
        chatHistory.innerHTML = '';
        
        savedChats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-history-item';
            chatItem.dataset.chatId = chat.chat_name;
            
            chatItem.innerHTML = `
                <div class="chat-title">${chat.title}</div>
                <div class="chat-actions">
                    <button class="chat-action-btn" onclick="renameChat('${chat.chat_name}', event)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="chat-action-btn" onclick="deleteChat('${chat.chat_name}', event)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            `;
            
            chatItem.onclick = (e) => {
                if (!e.target.closest('.chat-actions')) {
                    loadChat(chat.chat_name);
                }
            };
            
            chatHistory.appendChild(chatItem);
        });
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

function saveChatToHistory() {
    // Chat is automatically saved on the server side when messages are sent
    // Just refresh the sidebar to show the updated chat
    loadChatHistory();
}

async function loadChat(chatName) {
    try {
        const response = await fetch(`http://srv975554.hstgr.cloud:5000/chat/${chatName}`);
        const data = await response.json();
        
        if (data.conversation) {
            activeChatId = chatName;
            // Convert server format to your current format
            currentMessages = data.conversation.map(msg => ({
                sender: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content,
                formattedContent: formatMessageContent(msg.content)
            }));
            renderMessages();
            toggleSidebar();
        }
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

async function renameChat(chatName, event) {
    event.stopPropagation();
    currentChatAction = 'rename';
    currentChatId = chatName;
    
    try {
        const response = await fetch(`http://srv975554.hstgr.cloud:5000/chat/${chatName}`);
        const data = await response.json();
        
        chatModalTitle.textContent = 'Rename Chat';
        chatModalInput.placeholder = 'Write here';
        chatModalInput.value = data.title || '';
        chatModalActionBtn.textContent = 'Rename';
        chatModalActionBtn.classList.remove('danger');
        chatModal.classList.add('open');
        chatModalInput.focus();
    } catch (error) {
        console.error('Error loading chat for rename:', error);
    }
}

function deleteChat(chatName, event) {
    event.stopPropagation();
    currentChatAction = 'delete';
    currentChatId = chatName;
    
    chatModalTitle.textContent = 'Delete Chat';
    chatModalInput.value = '';
    chatModalInput.placeholder = 'You Sure, to delete?';
    chatModalActionBtn.textContent = 'Delete';
    chatModalActionBtn.classList.add('danger');
    chatModal.classList.add('open');
    // chatModalInput.focus();
}

function closeChatModal() {
    chatModal.classList.remove('open');
    currentChatAction = null;
    currentChatId = null;
    chatModalActionBtn.classList.remove('danger');
}

async function handleChatModalAction() {
    if (!currentChatAction || !currentChatId) return;

    if (currentChatAction === 'rename') {
        const newTitle = chatModalInput.value.trim();
        if (!newTitle) {
            alert('Please enter a new title');
            return;
        }
        try {
            const resp = await fetch(`http://srv975554.hstgr.cloud:5000/chat/${encodeURIComponent(currentChatId)}/rename`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });

            const result = await resp.json();
            if (resp.ok && result.success) {
                // close and refresh
                closeChatModal();
                loadChatHistory();
            } else {
                alert(result.message || 'Failed to rename chat');
            }
        } catch (error) {
            console.error('Error renaming chat:', error);
            alert('Error renaming chat (see console).');
        }
    } 
    else if (currentChatAction === 'delete') {
        

        try {
            const resp = await fetch(`http://srv975554.hstgr.cloud:5000/chat/${encodeURIComponent(currentChatId)}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await resp.json();

            if (resp.ok && result.success) {
                // if the deleted chat was active, reset client UI
                if (typeof activeChatId !== 'undefined' && activeChatId === currentChatId) {
                    startNewChat && startNewChat(); // call if implemented
                }
                closeChatModal();
                loadChatHistory();
            } else {
                alert(result.message || 'Failed to delete chat'); // yet to change this alert message
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Error deleting chat (see console).');
        }
    }
}
