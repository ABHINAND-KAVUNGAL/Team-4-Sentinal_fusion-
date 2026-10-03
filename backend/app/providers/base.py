from abc import ABC, abstractmethod
from typing import List, Dict, Any

class AIProvider(ABC):
    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the unique provider name and mode."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the provider is currently online and ready."""
        pass

    @abstractmethod
    async def summarize(self, text: str, context: Dict[str, Any]) -> str:
        """Generate an intelligence summary of the evidence text."""
        pass

    @abstractmethod
    async def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract recognized entities (Person, Device, Account, Location, Organization)."""
        pass

    @abstractmethod
    async def generate_findings(self, text: str, metadata: Dict[str, Any], filename: str) -> List[Dict[str, Any]]:
        """Generate structured AI-assisted investigative findings."""
        pass
