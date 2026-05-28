from abc import ABC, abstractmethod
from typing import Any


class BaseFeed(ABC):
    """Abstract base for all external data source integrations."""

    @abstractmethod
    async def fetch(self, **kwargs) -> list[dict[str, Any]]:
        """Fetch raw records from the data source."""
        ...

    @abstractmethod
    def normalize(self, raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Map raw source records to the platform's common field names."""
        ...

    async def fetch_normalized(self, **kwargs) -> list[dict[str, Any]]:
        raw = await self.fetch(**kwargs)
        return self.normalize(raw)
