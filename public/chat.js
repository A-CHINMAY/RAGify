const userInputField = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const sendButton = document.getElementById('send-btn');

// API base URL configuration
const API_BASE_URL = 'http://localhost:3000'; // Adjust this to match your backend server port

// Event Listeners
sendButton.addEventListener('click', sendMessage);
userInputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const userInput = userInputField.value.trim();
    if (userInput === '') return;

    displayMessage(userInput, 'user');
    userInputField.value = '';

    // Disable input during request
    disableInput(true);
    displayThinking();

    generateBotResponse(userInput);
}

function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function displayThinking() {
    const thinkingElement = document.createElement('div');
    thinkingElement.classList.add('message', 'bot', 'thinking');
    thinkingElement.textContent = 'Thinking...';
    thinkingElement.id = 'thinking-message';
    chatMessages.appendChild(thinkingElement);
    scrollToBottom();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function disableInput(disabled) {
    userInputField.disabled = disabled;
    sendButton.disabled = disabled;
}

async function generateBotResponse(userInput) {
    try {
        console.log("Sending request to server...");
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: userInput })
        });

        console.log("Server response status:", response.status);

        // Remove thinking message
        const thinkingMessage = document.getElementById('thinking-message');
        if (thinkingMessage) {
            thinkingMessage.remove();
        }

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Server response data:", data);

        const botResponse = data.response || "Sorry, I couldn't understand that.";
        displayMessage(botResponse, 'bot');
    } catch (error) {
        console.error("Error details:", error);
        displayMessage("Sorry, there was an error processing your request.", 'bot');
    } finally {
        disableInput(false);
    }
}