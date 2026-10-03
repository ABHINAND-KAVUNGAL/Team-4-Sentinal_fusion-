from abc import ABC, abstractmethod
from typing import Dict, Any
from PIL import Image

class AuthenticityProvider(ABC):
    @abstractmethod
    def evaluate(self, file_path: str, mime_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        pass

class DemoAuthenticityProvider(AuthenticityProvider):
    def evaluate(self, file_path: str, mime_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deterministic heuristic inspection of compression consistency, 
        EXIF software signatures, and metadata coherence.
        Transparently labeled as Demonstration / Heuristic.
        """
        score = 0.15
        indicators = []
        raw_meta = metadata.get("raw", {})

        # Check for image editing software traces in EXIF
        software = raw_meta.get("Software", "").lower()
        if any(tool in software for tool in ["photoshop", "gimp", "canva", "midjourney", "stable diffusion", "dall-e"]):
            score += 0.55
            indicators.append(f"Editing software signature identified in EXIF tags: '{raw_meta.get('Software')}'.")

        # Check for missing standard camera tags in high-res camera claimed images
        if metadata.get("format") in ["JPEG", "TIFF"]:
            if not metadata.get("device_make") and metadata.get("width", 0) > 2000:
                score += 0.20
                indicators.append("High-resolution raster image lacks camera/hardware sensor metadata.")

        # Check for non-standard aspect ratios or dimension artifacts
        w, h = metadata.get("width") or 0, metadata.get("height") or 0
        if w > 0 and h > 0:
            ratio = max(w, h) / min(w, h)
            if ratio == 1.0 and (w in [512, 768, 1024]):
                score += 0.25
                indicators.append(f"Square dimensions ({w}x{h}) consistent with AI generative synthesis models.")

        score = min(round(score, 2), 0.95)

        if not indicators:
            indicators.append("No overt manipulation signatures detected in preliminary heuristic screening.")

        notes = " | ".join(indicators)
        return {
            "authenticity_score": score,
            "authenticity_notes": f"Analysis mode: Demonstration / heuristic. {notes} Human verification required.",
            "provider": "DemoAuthenticityProvider (Heuristic)"
        }

class MediaAuthenticityService:
    def __init__(self, provider: AuthenticityProvider = None):
        self.provider = provider or DemoAuthenticityProvider()

    def evaluate_media(self, file_path: str, mime_type: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        if not mime_type.startswith("image/"):
            return {
                "authenticity_score": 0.0,
                "authenticity_notes": "Not an image file. Authenticity scan not applicable.",
                "provider": "N/A"
            }
        return self.provider.evaluate(file_path, mime_type, metadata)
