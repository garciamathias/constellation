import json
import logging
import re
from .providers import chatgpt, perplexity, mistral, claude


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