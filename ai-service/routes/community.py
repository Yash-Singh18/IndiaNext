"""
Community Expert Chat — WebSocket relay
Each room is identified by its chat_rooms.id (UUID).
The backend is a pure relay: it broadcasts messages to all other
connections in the same room. Message persistence is handled by
the frontend via the Supabase JS client.
"""
import json
import logging
from typing import Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory room registry: room_id -> active WebSocket connections
_rooms: Dict[str, Set[WebSocket]] = {}


@router.websocket("/ws/community/{room_id}")
async def community_chat(websocket: WebSocket, room_id: str):
    await websocket.accept()

    if room_id not in _rooms:
        _rooms[room_id] = set()
    _rooms[room_id].add(websocket)
    logger.info("community ws connect  room=%s  total=%d", room_id, len(_rooms[room_id]))

    try:
        while True:
            raw = await websocket.receive_text()

            # Relay to every other connection in the room
            dead: Set[WebSocket] = set()
            for conn in list(_rooms.get(room_id, set())):
                if conn is websocket:
                    continue
                try:
                    await conn.send_text(raw)
                except Exception:
                    dead.add(conn)

            if dead:
                _rooms[room_id] -= dead

    except WebSocketDisconnect:
        pass
    finally:
        room_conns = _rooms.get(room_id)
        if room_conns is not None:
            room_conns.discard(websocket)
            if not room_conns:
                _rooms.pop(room_id, None)
        logger.info("community ws disconnect  room=%s", room_id)
