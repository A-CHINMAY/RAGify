const userInputField = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const sendButton = document.getElementById('send-btn');

// Event Listeners
sendButton.addEventListener('click', handleSendMessage);
userInputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});

// Function to handle sending messages
function handleSendMessage() {
    const userInput = userInputField.value.trim();
    if (!userInput) return;

    displayMessage(userInput, 'user');
    userInputField.value = ''; // Clear input field
    userInputField.focus(); // Focus on the input field after sending the message

    // Disable input during processing
    toggleInputState(true);

    // Display "thinking..." message
    showThinkingMessage();

    // Generate bot response
    generateBotResponse(userInput);
}

// Function to display a message
function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const sanitizedMessage = escapeHtml(message);
    messageElement.textContent = sanitizedMessage;

    chatMessages.appendChild(messageElement);
    scrollToBottom(); // Ensure chat scrolls to the bottom when a new message is added
}

// Escape HTML to avoid XSS attacks
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to show the "thinking..." message
function showThinkingMessage() {
    const thinkingElement = document.createElement('div');
    thinkingElement.classList.add('message', 'bot', 'thinking');
    thinkingElement.textContent = 'Thinking...';
    thinkingElement.id = 'thinking-message';
    chatMessages.appendChild(thinkingElement);
    scrollToBottom();

    sendButton.textContent = 'Thinking...';
    sendButton.disabled = true;
}

// Function to scroll the chat container to the bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to toggle input and button states
function toggleInputState(disabled) {
    userInputField.disabled = disabled;
    sendButton.disabled = disabled;
    if (!disabled) {
        sendButton.textContent = 'Send';
    }
}

// Function to generate bot response
async function generateBotResponse(userInput) {
    const apiUrl =
        window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api/chat'
            : 'https://ragify.onrender.com/api/chat';

    try {
        const response = await fetch(apiUrl, {
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

        const data = await response.json();
        const botResponse = data.response?.trim() || "Sorry, I couldn't understand that.";

        // Display the bot response after a delay
        setTimeout(() => {
            displayMessage(botResponse, 'bot');
        }, 1000); // 1-second delay
    } catch (error) {
        console.error('Error:', error);
        displayMessage('Sorry, there was an error processing your request.', 'bot');
    } finally {
        toggleInputState(false); // Re-enable input
    }
}

// Function to set random positions for shapes
function setRandomPositions() {
    const shapes = document.querySelectorAll('.shape');

    shapes.forEach((shape) => {
        const shapeWidth = shape.offsetWidth;
        const shapeHeight = shape.offsetHeight;

        // Generate random positions within the visible area
        const randomX = Math.max(0, Math.random() * (window.innerWidth - shapeWidth));
        const randomY = Math.max(0, Math.random() * (window.innerHeight - shapeHeight));

        // Apply random position as CSS variables
        shape.style.setProperty('--random-x', `${randomX}px`);
        shape.style.setProperty('--random-y', `${randomY}px`);
    });
}

// Set random positions on page load and adjust on window resize
window.addEventListener('load', setRandomPositions);
window.addEventListener('resize', setRandomPositions);
