export function preventCopyButtonScroll(e) {
    if (e.target.matches('.toolbar-item button') || e.target.closest('.toolbar-item button')) {
        e.preventDefault();
    }
}

export function getChatElements() {
    return {
        chatBox: document.getElementById('chat-box'),
        messageInput: document.getElementById('message'),
        sendButton: document.getElementById('send-button')
    };
}