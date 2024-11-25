document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message');
    const sendButton = document.getElementById('send-button');
    
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false,
        sanitize: false,
    });

    // Empêcher le défilement lors du clic sur le bouton copier
    document.addEventListener('click', function(e) {
        if (e.target.matches('.toolbar-item button') || e.target.closest('.toolbar-item button')) {
            e.preventDefault();
        }
    });

    function adjustTextareaHeight() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
    }

    async function addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-container ${type}-container`;
    
        if (type === 'bot') {
            const logoDiv = document.createElement('div');
            logoDiv.className = 'message-logo';
            const logoImg = document.createElement('img');
            logoImg.src = '/static/images/logo.png';
            logoImg.alt = 'Logo Constellation';
            logoDiv.appendChild(logoImg);
            messageDiv.appendChild(logoDiv);
        }
    
        const contentDiv = document.createElement('div');
        contentDiv.className = `message ${type}`;
        
        if (type === 'bot') {
            // 1. Protection des blocs LaTeX
            let protectedContent = content
                .replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
                    return `@@LATEX_DISPLAY@@${encodeURIComponent(formula)}@@`;
                })
                .replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
                    return `@@LATEX_INLINE@@${encodeURIComponent(formula)}@@`;
                })
                .replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
                    return `@@LATEX_DISPLAY@@${encodeURIComponent(formula)}@@`;
                })
                .replace(/\$([\s\S]*?)\$/g, (match, formula) => {
                    return `@@LATEX_INLINE@@${encodeURIComponent(formula)}@@`;
                });
    
            // 2. Rendu Markdown
            let htmlContent = marked.parse(protectedContent);
            
            // 3. Création du conteneur temporaire
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            
            // 4. Ajout de la classe de langage par défaut
            tempDiv.querySelectorAll('pre code:not([class*="language-"])').forEach(block => {
                block.className = 'language-plaintext';
            });
            
            // 5. Traitement des blocs de code
            tempDiv.querySelectorAll('pre').forEach(pre => {
                // Créer le wrapper
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';
                wrapper.style.position = 'relative';
                
                // Déplacer le pre dans le wrapper
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);
                
            });
    
            // 6. Restauration des blocs LaTeX
            htmlContent = tempDiv.innerHTML
                .replace(/@@LATEX_DISPLAY@@(.*?)@@/g, (match, formula) => {
                    return `\\[${decodeURIComponent(formula)}\\]`;
                })
                .replace(/@@LATEX_INLINE@@(.*?)@@/g, (match, formula) => {
                    return `\\(${decodeURIComponent(formula)}\\)`;
                });
    
            contentDiv.innerHTML = htmlContent;
            
            // 7. Rendu LaTeX
            await MathJax.typesetPromise([contentDiv]);
            
            // 8. Coloration syntaxique
            Prism.highlightAllUnder(contentDiv);
        } else {
            contentDiv.textContent = content;
        }
    
        messageDiv.appendChild(contentDiv);
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        messageInput.value = '';
        adjustTextareaHeight();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.response) {
                addMessage(data.response, 'bot');
            } else if (data.error) {
                addMessage(`Erreur: ${data.error}`, 'bot');
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('Désolé, une erreur est survenue.', 'bot');
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('input', adjustTextareaHeight);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Observer pour le scroll automatique
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Vérifier si la mutation concerne l'ajout d'un message et non un changement d'état du bouton copier
            if (mutation.addedNodes.length && mutation.addedNodes[0].classList && 
                mutation.addedNodes[0].classList.contains('message-container')) {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        });
    });

    observer.observe(chatBox, {
        childList: true,
        subtree: true
    });

    // Ajustement initial du textarea
    adjustTextareaHeight();
});