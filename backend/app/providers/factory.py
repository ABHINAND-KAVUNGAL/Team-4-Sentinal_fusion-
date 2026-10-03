from app.providers.base import AIProvider
from app.providers.demo import DemoAIProvider
from app.providers.ollama import OllamaProvider
from app.config import settings

async def get_ai_provider() -> AIProvider:
    if settings.AI_PROVIDER.lower() == "ollama":
        provider = OllamaProvider()
        if await provider.is_available():
            return provider
    return DemoAIProvider()

def get_default_provider() -> AIProvider:
    return DemoAIProvider()
