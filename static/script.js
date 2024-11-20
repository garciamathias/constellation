document.getElementById('chat-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (!message) return;

    appendMessage('user-message', message);
    messageInput.value = '';

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });

        const data = await response.json();
        if (data.response) {
            appendMessage('bot-message', data.response);
        } else if (data.error) {
            appendMessage('bot-message', `Erreur : ${data.error}`);
        }
    } catch (error) {
        appendMessage('bot-message', 'Erreur de connexion au serveur.');
    }
});

function appendMessage(className, text) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);
    messageElement.textContent = text;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
