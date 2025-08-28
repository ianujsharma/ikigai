// fetch_llm.js - Server Integration

async function handleStreamedResponse(response, messageIndex, chatIdForThisStream) {
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
                        // ✅ lock updates to the stream’s chat
                        updateAssistantMessage(messageIndex, messageContent, chatIdForThisStream);
                    }
                    else if (data.type === 'status') {
                        if (data.content === 'typing') {
                            isTyping = true;
                        }
                    }
                    else if (data.type === 'complete') {
                        isTyping = false;
                        chatName = data.chat_name;
                        hideTypingIndicator();
                    }
                    else if (data.type === 'error') {
                        messageContent = data.content;
                        updateAssistantMessage(messageIndex, messageContent, chatIdForThisStream);
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
        updateAssistantMessage(messageIndex, 'Sorry, there was an error receiving the response.', chatIdForThisStream);
        hideTypingIndicator();
    }
    
    return { messageContent, chatName };
}

// Updated sendMessage function
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;

    const chatIdForThisMessage = activeChatId;   // ✅ lock chat id here

    addMessage('user', message);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    showTypingIndicator();
    
    try {
        // Add assistant message placeholder
        addMessage('assistant', ''); // Start with empty content
        const messageIndex = currentMessages.length - 1;
        
        // Get the response stream (send locked chat id)
        const response = await sendToBackend(message, chatIdForThisMessage);
        
        // Process the stream - updates bound to locked chat id
        const result = await handleStreamedResponse(response, messageIndex, chatIdForThisMessage);
        
        // Only update global activeChatId if it matches the locked one
        if (result.chatName && result.chatName === chatIdForThisMessage) {
            activeChatId = result.chatName;
        }
        
    } catch (error) {
        console.error('Send message error:', error);
        hideTypingIndicator();
        updateAssistantMessage(
            currentMessages.length - 1,
            "Sorry, I encountered an error. Please try again.",
            chatIdForThisMessage
        );
    }
}

// Update existing assistant message during streaming
function updateAssistantMessage(messageIndex, content, chatIdForThisMessage) {
    // ✅ skip updates if user switched chats
    if (chatIdForThisMessage !== activeChatId) return;

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
async function sendToBackend(message, chatId) {
    try {
        const response = await fetch(Server_ip+'/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                chat_name: chatId || null   // ✅ explicit chat id
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
    const chatIdForThisMessage = activeChatId;  // ✅ lock chat id here
    const response = await sendToBackend(message, chatIdForThisMessage);
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
                    if (data.chat_name && data.chat_name === chatIdForThisMessage) {
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
