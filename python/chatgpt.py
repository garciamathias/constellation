import logging
import requests
import json
from .config import openai_client

def chatgpt(input, context=None, instructions=None, model='gpt-4o', streaming=False):
    if not isinstance(input, str):
        logging.error("Le prompt doit être une chaîne de caractères.")
        return "Le prompt doit être une chaîne de caractères."

    try:
        # Garder uniquement ce log initial
        logging.info(f"Traitement de la requête avec le modèle {model}")
        logging.info(f"Context reçu: {json.dumps(context, indent=2) if context else 'Aucun contexte'}")

        # Construire le message system
        system_message = {"role": "system", "content": "You are Constellation, a helpful assistant created by Mathias Garcia."}
        if instructions:
            system_message["content"] += f" Tu vas respecter radicalement ces instructions : {instructions}"

        # Préparer les messages avec le contexte
        messages = [system_message]
        if context:
            # Supprimer les logs de debug du traitement
            simplified_context = []
            for msg in context:
                text = msg['content'][0]['text'] if isinstance(msg['content'], list) else msg['content']
                simplified_context.append({
                    "role": msg['role'],
                    "content": text
                })
            messages.extend(simplified_context)

        messages.append({
            "role": "user",
            "content": input
        })

        logging.info(f"Messages finaux envoyés à OpenAI: {json.dumps(messages, indent=2)}")

        # Envoyer la requête au modèle
        response = openai_client.chat.completions.create(
            model=model,
            messages=messages,
            stream=streaming
        )

        # Gérer le streaming
        if streaming:
            full_response = ""
            for chunk in response:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    print(content, end='', flush=True)  # Afficher le texte incrémentalement dans le terminal
                    yield content
            print()  # Assure une nouvelle ligne après la fin du streaming
        else:
            # Retourner la réponse normale si pas de streaming
            return response.choices[0].message.content

    except Exception as e:
        logging.exception("Erreur rencontrée lors de l'appel à ChatGPT.")
        yield f"Erreur OpenAI: {str(e)}"
