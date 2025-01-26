const userInputField = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const sendButton = document.getElementById('send-btn');

// Event Listeners
sendButton.addEventListener('click', sendMessage);
userInputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Function to send the message
function sendMessage() {
    const userInput = userInputField.value.trim();
    if (userInput === '') return;

    displayMessage(userInput, 'user');
    userInputField.value = ''; // Clear input field
    userInputField.focus(); // Focus on the input field after sending message

    // Disable input during request
    disableInput(true);

    // Display thinking message
    displayThinking();

    // Generate bot response (simulating async behavior)
    generateBotResponse(userInput);
}

// Function to display the message
function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const sanitizedMessage = escapeHtml(message);
    messageElement.textContent = sanitizedMessage;

    chatMessages.appendChild(messageElement);
    scrollToBottom(); // Ensure chat scrolls to the bottom when a new message is added
}

// Escape HTML to avoid XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to show the "thinking..." message
function displayThinking() {
    const thinkingElement = document.createElement('div');
    thinkingElement.classList.add('message', 'bot', 'thinking');
    thinkingElement.textContent = 'Thinking...';
    thinkingElement.id = 'thinking-message';
    chatMessages.appendChild(thinkingElement);
    scrollToBottom(); // Scroll to bottom after adding thinking message

    sendButton.textContent = 'Thinking...';
    sendButton.disabled = true;
}

// Function to scroll to the bottom of the chat container
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Disable input field and send button
function disableInput(disabled) {
    userInputField.disabled = disabled;
    sendButton.disabled = disabled;
    if (!disabled) {
        sendButton.textContent = 'Send';
    }
}

// Function to generate bot response
async function generateBotResponse(userInput) {
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: userInput })
        });

        // Remove "thinking..." message after receiving response
        const thinkingMessage = document.getElementById('thinking-message');
        if (thinkingMessage) {
            thinkingMessage.remove();
        }

        const data = await response.json();
        const botResponse = data.response && data.response.trim() ? data.response : "Sorry, I couldn't understand that.";

        // Display the bot response after a delay
        setTimeout(() => {
            displayMessage(botResponse, 'bot');
        }, 1000); // 1-second delay before bot responds
    } catch (error) {
        console.error("Error:", error);
        displayMessage("Sorry, there was an error processing your request.", 'bot');
    } finally {
        // Re-enable input
        disableInput(false);
    }
}



// Function to generate random position and assign to shapes
function setRandomPositions() {
    const shapes = document.querySelectorAll('.shape');

    shapes.forEach(shape => {
        // Generate random positions within the window
        const randomX = Math.floor(Math.random() * window.innerWidth) + "px";
        const randomY = Math.floor(Math.random() * window.innerHeight) + "px";

        // Apply random position as CSS variables for each shape
        shape.style.setProperty('--random-x', randomX);
        shape.style.setProperty('--random-y', randomY);
    });
}

// Set random positions on page load and periodically adjust
window.onload = setRandomPositions;
window.onresize = setRandomPositions;
