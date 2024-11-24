import os
import requests
import json
import time
import re
import logging

from openai import OpenAI
from anthropic import Anthropic
from mistralai import Mistral

# Configuration des clés
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

# Configuration des clients
openai_client = OpenAI(api_key=OPENAI_API_KEY)
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
mistral_client = client = Mistral(api_key=MISTRAL_API_KEY)

# Configuration de base du logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

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

logging.basicConfig(level=logging.DEBUG)

def classificator(input, provider=chatgpt, model='gpt-4o-mini'):
    instructions_for_classification = (
        "Please classify the following prompt and respond in JSON format with four attributes:\n"
        "search_web: Assess whether the prompt requires external data or up-to-date information that cannot be provided by the LLM's internal knowledge base\n"
        "from the web. Valid values are 'yes' or 'no'.\n"
        "complexity: Indicate the level of reasoning required to answer the prompt. Valid values are "
        "'simple', 'moderate', or 'complex'.\n"
        "maths: Determine whether the prompt requires maths. Valid values are 'yes' or 'no'.\n"
        "code: Determine whether the prompt requires code. Valid values are 'yes' or 'no'.\n"
        "Respond with a JSON object."
    )

    if callable(provider):
        try:
            response_of_classification = provider(input, instructions_for_classification, model=model)
        except Exception as e:
            logging.error(f"Erreur lors de l'appel au provider : {e}")
            return 'no', 'simple', 'no', 'no'
    else:
        logging.error("Provider is not a callable function.")
        return 'no', 'simple', 'no', 'no'

    # Validation de la réponse de Mistral
    if not response_of_classification:
        logging.error("La réponse du modèle est vide ou nulle. Valeurs par défaut utilisées.")
        return 'no', 'simple', 'no', 'no'
    if not isinstance(response_of_classification, str):
        logging.error("La réponse du modèle n'est pas une chaîne de caractères valide. Valeurs par défaut utilisées.")
        return 'no', 'simple', 'no', 'no'

    # Nettoyer et réduire la chaîne de réponse
    response_of_classification = re.sub(r"```(?:json)?|```", "", response_of_classification).strip()

    # Essayer d'analyser la réponse JSON
    try:
        response_json = json.loads(response_of_classification)
        # Validate expected keys
        expected_keys = ['search_web', 'complexity', 'maths', 'code']
        if not all(key in response_json for key in expected_keys):
            logging.error("Réponse JSON invalide ou incomplète. Valeurs par défaut utilisées.")
            return 'no', 'simple', 'no', 'no'

        # Extraire et valider les valeurs
        search_web = response_json.get('search_web', 'no')
        complexity = response_json.get('complexity', 'simple')
        maths = response_json.get('maths', 'no')
        code = response_json.get('code', 'no')

        if search_web not in ['yes', 'no'] or complexity not in ['simple', 'moderate', 'complex'] or \
           maths not in ['yes', 'no'] or code not in ['yes', 'no']:
            raise ValueError("Valeurs inattendues dans la réponse.")
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logging.error(f"Erreur de décodage ou de structure : {e}. Valeurs par défaut utilisées.")
        logging.debug("Réponse brute (après nettoyage) : %s", response_of_classification)
        return 'no', 'simple', 'no', 'no'

    return search_web, complexity, maths, code

def pipeline(input):
    """
    Pipeline pour traiter un prompt en fonction de sa classification et de sa complexité.

    Args:
        input (str): Le prompt utilisateur.

    Returns:
        str: La réponse générée par le pipeline.
    """
    try:
        # Classification du prompt
        search_web, complexity, maths, code = classificator(input=input)
        print(f"Classification: search_web={search_web}, complexity={complexity}, maths={maths}, code={code}")
    except Exception as e:
        raise ValueError(f"Erreur lors de la classification du prompt : {e}")

    # Gestion de la recherche sur le web
    if search_web == 'yes':
        try:
            # Appel à Perplexity pour récupérer les données du web
            data_web = perplexity(input)

            # Création du contexte pour le model
            context = (
                f"Voici le prompt de l'utilisateur : {input}\n"
                f"Voici les informations trouvées sur internet par rapport au prompt de l'utilisateur : {data_web}\n"
                "Réponds au prompt de l'utilisateur."
            )

            # Utilisation d'un model pour générer la réponse basée sur le contexte
            try:
                response = chatgpt(context)
                return response
            except Exception as e:
                raise ValueError(f"Erreur lors de la génération de réponse avec Mistral : {e}")

        except Exception as e:
            raise ValueError(f"Erreur lors de la recherche sur le web avec Perplexity : {e}")
    else:
        try:
            # Appel direct à ChatGPT pour répondre au prompt
            response = chatgpt(input=input)
            return response
        except Exception as e:
            raise ValueError(f"Erreur lors de la génération de réponse avec ChatGPT : {e}")