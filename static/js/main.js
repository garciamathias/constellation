import { configureMarked } from './config/marked.js';
import { preventCopyButtonScroll, getChatElements } from './utils/domUtils.js';
import { setupTextareaHandlers } from './ui/textarea.js';
import { sendMessageToServer } from './services/messageService.js';
import { addMessage } from './ui/messageUI.js';
import { setupScrollObserver } from './observers/scrollObserver.js';

document.addEventListener('DOMContentLoaded', function() {
    // Configuration initiale
    configureMarked();
    document.addEventListener('click', preventCopyButtonScroll);

    // Récupération des éléments DOM
    const elements = getChatElements();

    // Configuration des gestionnaires d'événements
    async function sendMessage() {
        const message = elements.messageInput.value.trim();
        if (!message) return;

        await addMessage(message, 'user', elements);
        elements.messageInput.value = '';
        elements.messageInput.style.height = 'auto';

        const response = await sendMessageToServer(message);
        if (response.response) {
            await addMessage(response.response, 'bot', elements);
        } else if (response.error) {
            await addMessage(`Erreur: ${response.error}`, 'bot', elements);
        }
    }

    // Setup des handlers
    elements.sendButton.addEventListener('click', sendMessage);
    setupTextareaHandlers(elements.messageInput, sendMessage);
    setupScrollObserver(elements.chatBox);
});