from flask import Flask, render_template, request, jsonify, Response
from python.chatgpt import chatgpt
import json  # Ajout de l'import manquant

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        if not user_message:
            return jsonify({'error': 'Message vide'}), 400
        
        response = pipeline(user_message)
        return jsonify({'response': response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stream', methods=['POST'])
def stream():
    try:
        data = request.json
        prompt = data.get('prompt')
        if not prompt:
            return jsonify({'error': 'Message vide'}), 400
        
        def generate():
            try:
                for chunk in chatgpt(prompt, streaming=True):
                    if chunk:
                        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            except Exception as e:
                # Log l'erreur et envoie un message d'erreur au client
                app.logger.error(f"Streaming error: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return Response(generate(), mimetype='text/event-stream')
    except Exception as e:
        app.logger.error(f"Stream initialization error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)