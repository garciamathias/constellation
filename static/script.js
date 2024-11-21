document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message');
    const sendButton = document.getElementById('send-button');

    // Configuration de marked
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
    });

    // Configuration de KaTeX
    const katexOptions = {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\[', right: '\\]', display: true},
            {left: '\\(', right: '\\)', display: false}
        ],
        throwOnError: false,
        strict: false,
        trust: true,
        macros: {
            "\\implies": "\\Rightarrow",
            "\\iff": "\\Leftrightarrow"
        }
    };

    function adjustTextareaHeight() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
    }

    function convertLatexDelimiters(text) {
        // Convertir les mathématiques en ligne : \(...\) -> $...$
        text = text.replace(/\\\((.*?)\\\)/g, '$$$1$');
        
        // Convertir les mathématiques en bloc : \[...\] -> $$...$$
        text = text.replace(/\\\[(.*?)\\\]/gs, '\n$$ $1 $$\n');
        
        // S'assurer que les blocs Markdown n'interfèrent pas avec les $$ délimiteurs
        text = text.replace(/```([\s\S]*?)```/g, match => {
            return match.replace(/\$\$/g, '§DOLLAR_BLOCK§'); // Échapper temporairement
        });
        text = text.replace(/§DOLLAR_BLOCK§/g, '$$$$'); // Restaurer après conversion
    
        return text;
    }
    

    function processMarkdownAndLatex(content) {
        // Préserver les blocs de code
        const codeBlocks = [];
        content = content.replace(/```[\s\S]*?```/g, match => {
            codeBlocks.push(match);
            return `§CODE§${codeBlocks.length - 1}§`;
        });

        content = convertLatexDelimiters(content)

        // Convertir Markdown en HTML
        content = marked.parse(content);

        // Restaurer les blocs de code
        content = content.replace(/§CODE§(\d+)§/g, (match, index) => codeBlocks[index]);

        console.log('rendered content : ', content)

        return content;
    }

    async function addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        if (type === 'bot') {
            // Traiter le contenu
            const processedContent = processMarkdownAndLatex(content);
            messageDiv.innerHTML = processedContent;
    
            // Attendre que le contenu soit inséré dans le DOM
            await new Promise(resolve => setTimeout(resolve, 0));
    
            // Rendre les formules mathématiques avec KaTeX
            try {
                const elements = messageDiv.querySelectorAll('.katex');
                if (elements.length === 0) {  // Si aucune formule n'a encore été rendue
                    renderMathInElement(messageDiv, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\[', right: '\\]', display: true},
                            {left: '\\(', right: '\\)', display: false}
                        ],
                        throwOnError: false,
                        strict: false,
                        trust: true,
                        macros: {
                            "\\implies": "\\Rightarrow",
                            "\\iff": "\\Leftrightarrow"
                        }
                    });
                }
            } catch (error) {
                console.error('KaTeX rendering error:', error);
            }
    
            // Colorer la syntaxe des blocs de code
            messageDiv.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        } else {
            messageDiv.textContent = content;
        }
    
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