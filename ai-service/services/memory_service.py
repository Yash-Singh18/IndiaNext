import json

import redis

from config.settings import settings


class MemoryService:
    def __init__(self):
        self._client = None

    @property
    def client(self) -> redis.Redis:
        if self._client is None:
            self._client = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                password=settings.redis_password or None,
                decode_responses=True,
            )
        return self._client

    def _key(self, session_id: str) -> str:
        return f"chat:memory:{session_id}"

    def get_history(self, session_id: str) -> list[dict]:
        raw = self.client.get(self._key(session_id))
        if raw:
            return json.loads(raw)
        return []

    def save_history(self, session_id: str, history: list[dict]):
        # Keep last 20 messages to avoid unbounded growth
        trimmed = history[-20:]
        self.client.setex(
            self._key(session_id),
            settings.memory_ttl_seconds,
            json.dumps(trimmed),
        )

    def add_message(self, session_id: str, role: str, content: str):
        history = self.get_history(session_id)
        history.append({"role": role, "content": content})
        self.save_history(session_id, history)

    def clear(self, session_id: str):
        self.client.delete(self._key(session_id))


memory_service = MemoryService()
