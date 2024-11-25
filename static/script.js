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

    function createCopyButton(pre) {
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.textContent = 'Copy';
        button.style.position = 'absolute';
        button.style.right = '8px';
        button.style.top = '8px';
        button.style.zIndex = '10';
    
        button.addEventListener('click', async () => {
            try {
                console.log('Bouton de copie cliqué');
                const codeElement = pre.querySelector('code');
                if (!codeElement) {
                    console.error('Aucun élément <code> trouvé dans le bloc <pre>', pre);
                    return;
                }
                
                const code = codeElement.innerText.trim();
                console.log('Code extrait pour copie:', code);
    
                await navigator.clipboard.writeText(code);
                console.log('Code copié dans le presse-papier');
                
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            } catch (error) {
                console.error('Erreur lors de la tentative de copie:', error);
                alert('Une erreur est survenue lors de la copie. Vérifiez vos permissions ou le support du navigateur.');
            }
        });
    
        return button;
    }
    

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
                block.className = 'language-javascript';
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
                
                // Ajouter le bouton de copie
                const copyButton = createCopyButton(pre);
                wrapper.appendChild(copyButton);
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
            if (mutation.addedNodes.length) {
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