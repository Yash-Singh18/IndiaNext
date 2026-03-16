import json
from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        self.active_connections.pop(session_id, None)

    async def send_message(self, session_id: str, message: dict):
        ws = self.active_connections.get(session_id)
        if ws:
            await ws.send_json(message)

    async def send_text(self, session_id: str, text: str):
        ws = self.active_connections.get(session_id)
        if ws:
            await ws.send_text(text)

    async def send_bytes(self, session_id: str, data: bytes):
        ws = self.active_connections.get(session_id)
        if ws:
            await ws.send_bytes(data)

    async def broadcast(self, message: dict):
        for ws in self.active_connections.values():
            await ws.send_json(message)


ws_manager = WebSocketManager()
