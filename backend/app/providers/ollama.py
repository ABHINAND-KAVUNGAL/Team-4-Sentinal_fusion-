import json
import httpx
from typing import List, Dict, Any
from app.providers.base import AIProvider
from app.config import settings

class OllamaProvider(AIProvider):
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def get_provider_name(self) -> str:
        return f"Ollama Local ({self.model})"

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def summarize(self, text: str, context: Dict[str, Any]) -> str:
        prompt = (
            f"You are a forensic analyst assistant. Summarize this evidence text concisely for an investigator:\n\n"
            f"{text[:2000]}"
        )
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(
                    f"{self.base_url}/api/generate",
                    json={"model": self.model, "prompt": prompt, "stream": False}
                )
                if res.status_code == 200:
                    return res.json().get("response", "").strip()
        except Exception:
            pass
        return "Local Ollama generation timed out or was interrupted. Fallback to baseline summary."

    async def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        # Fallback helper if json parsing fails
        from app.providers.demo import DemoAIProvider
        demo_fallback = DemoAIProvider()
        
        prompt = (
            "Extract entities from this evidence. Return ONLY valid JSON array with objects having: "
            "name, category (one of: PERSON, DEVICE, ACCOUNT, LOCATION, ORGANIZATION), risk_score (0-100), attributes.\n\n"
            f"{text[:1500]}"
        )
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(
                    f"{self.base_url}/api/generate",
                    json={"model": self.model, "prompt": prompt, "stream": False, "format": "json"}
                )
                if res.status_code == 200:
                    data = json.loads(res.json().get("response", "[]"))
                    if isinstance(data, list):
                        return data
        except Exception:
            pass
        return await demo_fallback.extract_entities(text)

    async def generate_findings(self, text: str, metadata: Dict[str, Any], filename: str) -> List[Dict[str, Any]]:
        from app.providers.demo import DemoAIProvider
        demo_fallback = DemoAIProvider()
        return await demo_fallback.generate_findings(text, metadata, filename)
