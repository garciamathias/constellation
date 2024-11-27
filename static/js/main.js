import { configureMarked } from './config/marked.js';
import { preventCopyButtonScroll, getChatElements } from './utils/domUtils.js';
import { setupTextareaHandlers } from './ui/textarea.js';
import { addMessage, renderStreamingChunk } from './ui/messageUI.js';
import { setupScrollObserver } from './observers/scrollObserver.js';

// Ajouter cette variable pour stocker le contexte
let conversationContext = [];

function isUserAtBottom(element, threshold = 100) {
    return element.scrollHeight - element.clientHeight - element.scrollTop <= threshold;
}

document.addEventListener('DOMContentLoaded', function() {
    // Configuration initiale
    configureMarked();
    document.addEventListener('click', preventCopyButtonScroll);

    // Récupération des éléments DOM
    const elements = getChatElements();

    // Configuration des gestionnaires d'événements
    async function sendMessageWithStreaming() {
        const message = elements.messageInput.value.trim();
        if (!message) return;

        // Ajouter le message de l'utilisateur au contexte
        conversationContext.push({
            role: "user",
            content: message
        });

        // Garder uniquement ce log principal
        console.log('Context actuel:', JSON.stringify(conversationContext, null, 2));

        // Envoie le message utilisateur
        await addMessage(message, 'user', elements);
        elements.messageInput.value = '';
        elements.messageInput.style.height = 'auto';

        // Crée le conteneur pour la réponse du bot
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-container bot-container';
        
        const logoDiv = document.createElement('div');
        logoDiv.className = 'message-logo';
        const logoImg = document.createElement('img');
        logoImg.src = '/static/images/logo.png';
        logoImg.alt = 'Logo Constellation';
        logoDiv.appendChild(logoImg);
        
        const responseDiv = document.createElement('div');
        responseDiv.className = 'message bot';
        
        messageDiv.appendChild(logoDiv);
        messageDiv.appendChild(responseDiv);
        elements.chatBox.appendChild(messageDiv);
        
        let accumulatedText = '';
        let lastRenderTime = 0;
        const minRenderInterval = 100; // ms
        let wasAtBottom = true; // Track initial scroll position

        try {
            const response = await fetch('/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: message,
                    context: conversationContext 
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        accumulatedText += data.chunk;
                        
                        const currentTime = Date.now();
                        if (currentTime - lastRenderTime >= minRenderInterval) {
                            wasAtBottom = isUserAtBottom(elements.chatBox); // Check before rendering
                            await renderStreamingChunk(responseDiv, accumulatedText);
                            lastRenderTime = currentTime;
                            
                            // Only scroll if user was already at bottom
                            if (wasAtBottom) {
                                elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
                            }
                        }
                    }
                }
            }
            
            // Rendu final pour s'assurer que tout le contenu est affiché
            if (accumulatedText) {
                wasAtBottom = isUserAtBottom(elements.chatBox);
                await renderStreamingChunk(responseDiv, accumulatedText);
                if (wasAtBottom) {
                    elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
                }
            }

            // Ajouter la réponse du bot au contexte après le streaming
            if (accumulatedText) {
                conversationContext.push({
                    role: "assistant",
                    content: accumulatedText
                });
            }

        } catch (error) {
            console.error('Erreur:', error);
            responseDiv.textContent = 'Une erreur est survenue';
        }
    }

    // Setup des handlers
    elements.sendButton.addEventListener('click', sendMessageWithStreaming);
    setupTextareaHandlers(elements.messageInput, sendMessageWithStreaming);
    setupScrollObserver(elements.chatBox);
});