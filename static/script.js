document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message');
    const sendButton = document.getElementById('send-button');
    marked.setOptions({
        breaks: true, // Permet les retours à la ligne avec un seul \n
        gfm: true, // Active GitHub Flavored Markdown
        headerIds: false, // Désactive les IDs automatiques des titres
        mangle: false, // Désactive la transformation des emails
        sanitize: false, // Désactivé car nous gérons nous-mêmes le contenu
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
            // 1. Protéger les blocs LaTeX
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
    
            // 2. Appliquer le rendu Markdown
            let htmlContent = marked.parse(protectedContent);
            
            // 3. Créer un conteneur temporaire pour manipuler le HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            
            // 4. Ajouter la classe de langage par défaut aux blocs sans langage spécifié
            tempDiv.querySelectorAll('pre code:not([class*="language-"])').forEach(block => {
                block.className = 'language-javascript';
            });
            
            // 5. Ajouter un bouton de copie à chaque bloc de code
            tempDiv.querySelectorAll('pre').forEach(pre => {
                pre.classList.add('code-toolbar');
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';
                
                // Créer le bouton de copie
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-button';
                copyButton.textContent = 'Copier';
                copyButton.onclick = async () => {
                    const code = pre.querySelector('code').textContent;
                    try {
                        await navigator.clipboard.writeText(code);
                        copyButton.textContent = 'Copié !';
                        copyButton.classList.add('success');
                        setTimeout(() => {
                            copyButton.textContent = 'Copier';
                            copyButton.classList.remove('success');
                        }, 2000);
                    } catch (err) {
                        console.error('Erreur lors de la copie:', err);
                        copyButton.textContent = 'Erreur';
                        setTimeout(() => {
                            copyButton.textContent = 'Copier';
                        }, 2000);
                    }
                };
                
                wrapper.appendChild(copyButton);
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);
            });
    
            // 6. Restaurer les blocs LaTeX
            htmlContent = tempDiv.innerHTML
                .replace(/@@LATEX_DISPLAY@@(.*?)@@/g, (match, formula) => {
                    return `\\[${decodeURIComponent(formula)}\\]`;
                })
                .replace(/@@LATEX_INLINE@@(.*?)@@/g, (match, formula) => {
                    return `\\(${decodeURIComponent(formula)}\\)`;
                });
    
            contentDiv.innerHTML = htmlContent;
            
            // 7. Appliquer le rendu LaTeX
            await MathJax.typesetPromise([contentDiv]);
            
            // 8. Activer la coloration syntaxique
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
            if (mutation.addedNodes.length) {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        });
    });

    observer.observe(chatBox, {
        childList: true,
        subtree: true
    });

    // Ajuster la hauteur initiale du textarea
    adjustTextareaHeight();
});