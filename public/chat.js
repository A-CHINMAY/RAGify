const userInputField = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const sendButton = document.getElementById('send-btn');

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
        const response = await fetch('https://ra-gify.vercel.app/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: userInput })
        });

        // Remove "thinking..." message
        const thinkingMessage = document.getElementById('thinking-message');
        if (thinkingMessage) {
            thinkingMessage.remove();
        }

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const botResponse = data.response || "Sorry, I couldn't understand that.";

        displayMessage(botResponse, 'bot');
    } catch (error) {
        console.error("Error:", error);
        displayMessage("Sorry, there was an error processing your request.", 'bot');
    } finally {
        // Re-enable input
        disableInput(false);
    }
}