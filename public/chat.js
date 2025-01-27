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
    userInputField.focus();

    toggleInputState(true);
    showThinkingMessage();
    generateBotResponse(userInput);
}

// Function to display a message
function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    const sanitizedMessage = escapeHtml(message);
    messageElement.textContent = sanitizedMessage;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function toggleInputState(disabled) {
    userInputField.disabled = disabled;
    sendButton.disabled = disabled;
    if (!disabled) {
        sendButton.textContent = 'Send';
    }
}

// Function to handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    const errorMessage = 'Sorry, there was an error connecting to the server. Please try again.';
    displayMessage(errorMessage, 'bot');
    toggleInputState(false);
}

// Function to generate bot response
async function generateBotResponse(userInput) {
    const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api/chat'
        : 'https://ragify.onrender.com/api/chat';

    const retries = 3; // Number of retry attempts
    let attempt = 0;

    while (attempt < retries) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                credentials: 'include',
                body: JSON.stringify({ query: userInput })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Remove thinking message
            const thinkingMessage = document.getElementById('thinking-message');
            if (thinkingMessage) {
                thinkingMessage.remove();
            }

            const data = await response.json();
            const botResponse = data.response?.trim() || "Sorry, I couldn't understand that.";

            // Display the bot response after a small delay
            setTimeout(() => {
                displayMessage(botResponse, 'bot');
            }, 500);

            break; // Success - exit the retry loop
        } catch (error) {
            attempt++;
            console.error(`Attempt ${attempt} failed:`, error);

            if (attempt === retries) {
                handleApiError(error);
            } else {
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    toggleInputState(false);
}

// Set random positions for shapes
function setRandomPositions() {
    const shapes = document.querySelectorAll('.shape');
    shapes.forEach((shape) => {
        const shapeWidth = shape.offsetWidth;
        const shapeHeight = shape.offsetHeight;
        const randomX = Math.max(0, Math.random() * (window.innerWidth - shapeWidth));
        const randomY = Math.max(0, Math.random() * (window.innerHeight - shapeHeight));
        shape.style.setProperty('--random-x', `${randomX}px`);
        shape.style.setProperty('--random-y', `${randomY}px`);
    });
}

// Initialize shapes
window.addEventListener('load', setRandomPositions);
window.addEventListener('resize', setRandomPositions);