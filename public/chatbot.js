/**
 * CITYVOICE AI CHATBOT
 * Powered by Google Gemini API
 */

// Load chatbot HTML and initialize
document.addEventListener("DOMContentLoaded", () => {
    fetch("/chatbot.html")
        .then(response => response.text())
        .then(html => {
            document.getElementById("chatbot-container").innerHTML = html;
            // Now that the HTML is loaded, run the main chatbot logic
            initializeChatbot();
        })
        .catch(error => {
            console.error('Error loading chatbot:', error);
        });
});

function initializeChatbot() {
    // ========================================
    // CONFIGURATION
    // ========================================
    
    // IMPORTANT: Replace with your actual Gemini API key from Google AI Studio
    // Get your free key at: https://makersuite.google.com/app/apikey
    const GEMINI_API_KEY = "PASTE_YOUR_FREE_API_KEY_HERE";
    
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    // System prompt - defines the bot's personality and knowledge
    const SYSTEM_PROMPT = `You are the CityVoice AI Assistant. Your role is to help citizens understand and use the CityVoice platform effectively.

**What you can help with:**
- Explaining what CityVoice is and its purpose
- Guiding users on how to report civic issues (potholes, street lights, garbage, etc.)
- Helping users track their complaint status
- Explaining the complaint submission process
- Answering questions about account creation and login
- Providing information about the public map feature
- General navigation help on the website

**Important guidelines:**
- Be friendly, helpful, and concise
- Keep responses brief (2-3 sentences when possible)
- You cannot resolve issues directly - guide users to use the platform
- If asked about specific complaint status, tell them to login and check the Track page
- For technical issues, suggest refreshing the page or contacting support
- If you don't know something, be honest and suggest alternative help

**CityVoice Platform Overview:**
CityVoice is a civic engagement platform that empowers citizens to report and track complaints about local infrastructure and services. Users can submit complaints with photos and location, track progress in real-time, and view public complaints on an interactive map. The platform promotes transparency and accountability in local governance.

**Key Features:**
1. Submit Complaints - Report issues with photos, description, location, and category
2. Track Status - Monitor your complaints with real-time updates
3. Public Map - View all reported issues in your area
4. User Dashboard - Manage your profile and complaint history

Remember: Be helpful, concise, and guide users to use the platform's features!`;

    // Conversation history
    let conversationHistory = [];

    // ========================================
    // DOM ELEMENTS
    // ========================================
    
    const openChatButton = document.getElementById('open-chat-button');
    const chatWidget = document.getElementById('chat-widget');
    const closeChat = document.getElementById('close-chat');
    const sendMessageBtn = document.getElementById('send-message');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatTyping = document.getElementById('chat-typing');

    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    // Open chat widget
    openChatButton.addEventListener('click', () => {
        chatWidget.classList.remove('hidden');
        chatInput.focus();
    });

    // Close chat widget
    closeChat.addEventListener('click', () => {
        chatWidget.classList.add('hidden');
    });

    // Send message on button click
    sendMessageBtn.addEventListener('click', sendMessage);

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // ========================================
    // CHAT FUNCTIONS
    // ========================================
    
    /**
     * Send user message and get bot response
     */
    async function sendMessage() {
        const message = chatInput.value.trim();
        
        if (!message) return;

        // Disable input while processing
        chatInput.disabled = true;
        sendMessageBtn.disabled = true;

        // Add user message to UI
        addMessageToUI(message, 'user');

        // Clear input
        chatInput.value = '';

        // Show typing indicator
        chatTyping.classList.remove('hidden');

        // Get bot response
        await getBotResponse(message);

        // Re-enable input
        chatInput.disabled = false;
        sendMessageBtn.disabled = false;
        chatInput.focus();
    }

    /**
     * Add message to the chat UI
     * @param {string} text - Message text
     * @param {string} sender - 'user' or 'bot'
     */
    function addMessageToUI(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.textContent = sender === 'bot' ? '🤖' : '👤';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Get response from Gemini AI
     * @param {string} userMessage - User's message
     */
    async function getBotResponse(userMessage) {
        // Add user message to conversation history
        conversationHistory.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        // Prepare the API request
        const requestBody = {
            system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: conversationHistory,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Extract bot reply
            const botReply = data.candidates[0]?.content?.parts[0]?.text || 
                           "I'm sorry, I couldn't generate a response. Please try again.";

            // Add bot reply to conversation history
            conversationHistory.push({
                role: 'model',
                parts: [{ text: botReply }]
            });

            // Hide typing indicator
            chatTyping.classList.add('hidden');

            // Add bot message to UI
            addMessageToUI(botReply, 'bot');

        } catch (error) {
            console.error('Error getting bot response:', error);
            
            // Hide typing indicator
            chatTyping.classList.add('hidden');

            // Show error message
            let errorMessage = "I'm having trouble connecting right now. Please try again in a moment.";
            
            // More specific error messages
            if (error.message.includes('API error: 429')) {
                errorMessage = "I'm receiving too many requests right now. Please wait a moment and try again.";
            } else if (error.message.includes('API error: 401') || error.message.includes('API error: 403')) {
                errorMessage = "There's an authentication issue. Please contact support.";
            } else if (!navigator.onLine) {
                errorMessage = "You appear to be offline. Please check your internet connection.";
            }
            
            addMessageToUI(errorMessage, 'bot');
        }
    }

    // ========================================
    // QUICK START SUGGESTIONS (Optional)
    // ========================================
    
    /**
     * Add quick action buttons for common questions
     */
    function addQuickActions() {
        const quickActions = [
            "How do I report a pothole?",
            "What is CityVoice?",
            "How do I track my complaint?",
            "How do I create an account?"
        ];

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'quick-actions';
        actionsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 20px; background: white; border-top: 1px solid #e2e8f0;';

        quickActions.forEach(action => {
            const button = document.createElement('button');
            button.textContent = action;
            button.style.cssText = 'padding: 8px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; transition: all 0.2s;';
            
            button.addEventListener('mouseenter', () => {
                button.style.background = '#e2e8f0';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = '#f1f5f9';
            });
            
            button.addEventListener('click', () => {
                chatInput.value = action;
                sendMessage();
            });
            
            actionsContainer.appendChild(button);
        });

        // Insert before input area
        const inputArea = document.getElementById('chat-input-area');
        inputArea.parentNode.insertBefore(actionsContainer, inputArea);
    }

    // Optionally add quick actions on load
    // Uncomment the line below if you want quick action buttons
    // addQuickActions();

    console.log('✅ CityVoice AI Chatbot initialized!');
}
