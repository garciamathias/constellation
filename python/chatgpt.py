import logging
import requests
from .config import openai_client

def chatgpt(input, instructions=None, model='gpt-4o', streaming=False):
    if not isinstance(input, str):
        logging.error("Le prompt doit être une chaîne de caractères.")
        return "Le prompt doit être une chaîne de caractères."

    try:
        logging.info(f"Envoi de la requête à ChatGPT avec le modèle {model}.")

        # Construire le message system avec les instructions si elles existent
        system_content = "You are Constellation, a helpful assistant."
        if instructions:
            system_content += f" Tu vas respecter radicalement ces instructions : {instructions}"

        # Envoyer la requête au modèle
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": input}
            ],
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
