export function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

export function setupTextareaHandlers(textarea, sendCallback) {
    textarea.addEventListener('input', () => adjustTextareaHeight(textarea));
    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendCallback();
        }
    });
}