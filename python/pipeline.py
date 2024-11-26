from .providers import chatgpt, perplexity, mistral, claude
from .classifier import classificator


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