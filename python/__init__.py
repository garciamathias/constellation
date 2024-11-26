# __init__.py

# Import des composants principaux
from .config import (
    openai_client,
    anthropic_client,
    mistral_client,
    PERPLEXITY_API_KEY
)

from .providers import (
    chatgpt,
    claude,
    mistral,
    perplexity
)

from .classifier import classificator
from .pipeline import pipeline

# Définir quels éléments sont exposés lors d'un 'from package import *'
__all__ = [
    # Config
    'openai_client',
    'anthropic_client',
    'mistral_client',
    'PERPLEXITY_API_KEY',
    
    # Providers
    'chatgpt',
    'claude',
    'mistral',
    'perplexity',
    
    # Classifier
    'classificator',
    
    # Pipeline
    'pipeline'
]

# Version du package
__version__ = '1.0.0'