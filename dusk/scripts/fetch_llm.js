// fetch_llm.js - Server Integration

async function handleStreamedResponse(response, messageIndex) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let messageContent = '';
    let isTyping = true;
    let chatName = null;
    
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    
                    if (data.type === 'token') {
                        messageContent += data.content;
                        // UPDATE MESSAGE IMMEDIATELY - This is the key part
                        updateAssistantMessage(messageIndex, messageContent);
                    }
                    else if (data.type === 'status') {
                        if (data.content === 'typing') {
                            isTyping = true;
                        }
                    }
                    else if (data.type === 'complete') {
                        isTyping = false;
                        chatName = data.chat_name;
                        if (chatName) {
                            activeChatId = chatName;
                        }
                        hideTypingIndicator();
                    }
                    else if (data.type === 'error') {
                        messageContent = data.content;
                        updateAssistantMessage(messageIndex, messageContent);
                        hideTypingIndicator();
                        break;
                    }
                } catch (e) {
                    console.error('Error parsing chunk:', e, 'Raw line:', line);
                }
            }
        }
    } catch (error) {
        console.error('Stream reading error:', error);
        updateAssistantMessage(messageIndex, 'Sorry, there was an error receiving the response.');
        hideTypingIndicator();
    }
    
    return { messageContent, chatName };
}

// Updated sendMessage function
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;

    addMessage('user', message);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    showTypingIndicator();
    
    try {
        // Add assistant message placeholder
        addMessage('assistant', ''); // Start with empty content
        const messageIndex = currentMessages.length - 1;
        
        // Get the response stream
        const response = await sendToBackend(message);
        
        // Process the stream - THIS WILL UPDATE THE MESSAGE IN REAL-TIME
        const result = await handleStreamedResponse(response, messageIndex);
        
        // Update activeChatId if we got a chat name
        if (result.chatName) {
            activeChatId = result.chatName;
        }
        
    } catch (error) {
        console.error('Send message error:', error);
        hideTypingIndicator();
        updateAssistantMessage(
            currentMessages.length - 1,
            "Sorry, I encountered an error. Please try again."
        );
    }
}
// Update existing assistant message during streaming
function updateAssistantMessage(messageIndex, content) {
    const message = currentMessages[messageIndex];
    if (message && message.sender === 'assistant') {
        message.content = content;
        message.formattedContent = formatMessageContent(content);
        
        if (message.element) {
            const messageText = message.element.querySelector('.message-text');
            if (messageText) {
                messageText.innerHTML = message.formattedContent;
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }
    }
}

// Send to your Flask backend
async function sendToBackend(message) {
    try {
        const response = await fetch('https://srv975554.hstgr.cloud:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                chat_name: activeChatId || null  // Send current chat name if exists
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Keep your existing fetchFromLLM name but make it work with the new backend
async function fetchFromLLM(message) {
    const response = await sendToBackend(message);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                if (data.type === 'token') {
                    fullResponse += data.content;
                } else if (data.type === 'complete') {
                    if (data.chat_name) {
                        activeChatId = data.chat_name;
                    }
                }
            } catch (e) {
                console.error('Error parsing chunk:', e);
            }
        }
    }
    
    return fullResponse;
}
