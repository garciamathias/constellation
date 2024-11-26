import logging
import requests
from .config import openai_client, anthropic_client, mistral_client, PERPLEXITY_API_KEY

def chatgpt(input, instructions=None, model='gpt-4o'):
    if not isinstance(input, str):
        logging.error("Le prompt doit être une chaîne de caractères.")
        return "Le prompt doit être une chaîne de caractères."

    try:
        logging.info(f"Envoi de la requête à ChatGPT avec le modèle {model}.")

        # Construire le message system avec les instructions si elles existent
        system_content = "You are Constellation, a helpful assistant."
        if instructions:  # Ajouter les instructions au rôle "system" si elles existent
            system_content += f" Tu vas respecter radicalement ces instructions : {instructions}"

        # Envoyer la requête au modèle
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": input}
            ]
        )
        logging.info("Réponse reçue de ChatGPT.")
        return response.choices[0].message.content
    except Exception as e:
        logging.exception("Erreur rencontrée lors de l'appel à ChatGPT.")
        return f"Erreur OpenAI: {str(e)}"

def claude(input, instructions=None, model='claude-3-5-sonnet-latest'):
    if not isinstance(input, str):
        logging.error("Le prompt doit être une chaîne de caractères.")
        return "Le prompt doit être une chaîne de caractères."

    try:
        logging.info(f"Envoi de la requête à Claude avec le modèle {model}.")

        # Construire le message system avec les instructions si elles existent
        system_content = "You are Constellation, a helpful assistant."
        if instructions:  # Ajouter les instructions au rôle "system" si elles existent
            system_content += f" Tu vas respecter radicalement ces instructions : {instructions}"

        # Envoyer la requête au modèle
        message = anthropic_client.messages.create(
            model=model,
            max_tokens=8192,
            system=system_content,
            messages=[
                {"role": "user", "content": f"Voici le prompt de l'utilisateur : {input}"}
            ]
        )
        logging.info("Réponse reçue de Claude.")
        return message.content[0].text
    except Exception as e:
        logging.exception("Erreur rencontrée lors de l'appel à Claude.")
        return f"Erreur Anthropic: {str(e)}"



def mistral(input, instructions=None, model='mistral-large-latest'):
    if not isinstance(input, str):
        logging.error("Le prompt doit être une chaîne de caractères.")
        return "Le prompt doit être une chaîne de caractères."

    try:
        logging.info(f"Envoi de la requête à Mistral avec le modèle {model}.")

        # Construire le message system avec les instructions si elles existent
        system_content = "You are Constellation, a helpful assistant."
        if instructions:  # Ajouter les instructions au rôle "system" si elles existent
            system_content += f" Tu vas respecter radicalement ces instructions : {instructions}"

        # Envoyer la requête au modèle
        response = mistral_client.chat.complete(
            model=model,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": input}
            ]
        )
        logging.info("Réponse reçue de Mistral.")
        return response.choices[0].message.content
    except Exception as e:
        logging.exception("Erreur rencontrée lors de l'appel à Mistral.")
        return f"Erreur Mistral: {str(e)}"

def perplexity(input, instructions=None):        #
    if not isinstance(input, str):
        logging.error("Le prompt doit être une chaîne de caractères.")

    try:
        logging.info("Envoi de la requête à Perplexity.")
        url = "https://api.perplexity.ai/chat/completions"
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-sonar-large-128k-online",
            "messages": [
                {"role": "user", "content": input}
            ],
            "max_tokens": 1024
        }
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        logging.info("Réponse reçue de Perplexity.")
        return response.json()['choices'][0]['message']['content']
    except requests.RequestException as e:
        logging.exception("Erreur réseau ou HTTP rencontrée lors de l'appel à Perplexity.")
        return f"Erreur Perplexity: {str(e)}"
    except Exception as e:
        logging.exception("Erreur inattendue lors de l'appel à Perplexity.")
        return f"Erreur Perplexity: {str(e)}"