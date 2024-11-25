/**
 * messageUI.js - Gestion de l'affichage des messages
 */

import { 
    protectLatexFormulas, 
    restoreLatexFormulas, 
    containsLatex,
    renderMathJax,
    sanitizeMathContent
} from '../utils/mathUtils.js';

/**
 * Ajoute un message dans la fenêtre de chat
 */
export async function addMessage(content, type, elements) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-container ${type}-container`;

    if (type === 'bot') {
        messageDiv.appendChild(createBotLogo());
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = `message ${type}`;

    if (type === 'bot') {
        await renderBotMessage(contentDiv, content);
    } else {
        contentDiv.textContent = content;
    }

    messageDiv.appendChild(contentDiv);
    elements.chatBox.appendChild(messageDiv);
    elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
}

/**
 * Crée le logo pour les messages du bot
 */
function createBotLogo() {
    const logoDiv = document.createElement('div');
    logoDiv.className = 'message-logo';
    const logoImg = document.createElement('img');
    logoImg.src = '/static/images/logo.png';
    logoImg.alt = 'Logo Constellation';
    logoDiv.appendChild(logoImg);
    return logoDiv;
}

/**
 * Ajoute les classes de langage par défaut aux blocs de code
 */
function addDefaultLanguageClass(tempDiv) {
    tempDiv.querySelectorAll('pre code:not([class*="language-"])').forEach(block => {
        block.className = 'language-plaintext';
    });
}

/**
 * Ajoute les wrappers pour les blocs de code
 */
function addCodeWrappers(tempDiv) {
    tempDiv.querySelectorAll('pre').forEach(pre => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        wrapper.style.position = 'relative';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
    });
}

/**
 * Effectue le rendu complet d'un message du bot
 */
async function renderBotMessage(contentDiv, content) {
    try {
        const sanitizedContent = sanitizeMarkdown(content);
        const protectedContent = protectLatexFormulas(sanitizedContent);
        const htmlContent = marked.parse(protectedContent);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        addDefaultLanguageClass(tempDiv);
        addCodeWrappers(tempDiv);

        const finalContent = restoreLatexFormulas(tempDiv.innerHTML);
        contentDiv.innerHTML = finalContent;

        if (containsLatex(content)) {
            await renderMathJax(contentDiv);
        }

        if (containsCodeBlocks(content)) {
            Prism.highlightAllUnder(contentDiv);
        }
    } catch (error) {
        console.error('Error rendering bot message:', error);
        contentDiv.textContent = 'Une erreur est survenue lors du rendu du message.';
    }
}

/**
 * Crée un élément de toolbar pour les blocs de code
 */
export function createCodeToolbar(codeBlock) {
    const toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';
    
    const toolbarItem = document.createElement('div');
    toolbarItem.className = 'toolbar-item';
    
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copier';
    copyButton.onclick = () => {
        navigator.clipboard.writeText(codeBlock.textContent)
            .then(() => {
                copyButton.textContent = 'Copié !';
                setTimeout(() => {
                    copyButton.textContent = 'Copier';
                }, 2000);
            })
            .catch(err => {
                console.error('Erreur lors de la copie:', err);
                copyButton.textContent = 'Erreur';
            });
    };
    
    toolbarItem.appendChild(copyButton);
    toolbar.appendChild(toolbarItem);
    return toolbar;
}

/**
 * Nettoie le contenu Markdown des éléments potentiellement dangereux
 */
function sanitizeMarkdown(content) {
    return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
}

/**
 * Vérifie si le message contient des blocs de code
 */
function containsCodeBlocks(content) {
    return /```[\s\S]*?```/g.test(content);
}

/**
 * Met à jour l'état de chargement d'un message
 */
export function updateMessageLoadingState(messageDiv, isLoading) {
    if (isLoading) {
        messageDiv.classList.add('loading');
    } else {
        messageDiv.classList.remove('loading');
    }
}