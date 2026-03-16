import json
import traceback

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from core.ws_manager import ws_manager

router = APIRouter()

# Late import to avoid circular deps at module load
_agent_graph = None


def _get_agent():
    global _agent_graph
    if _agent_graph is None:
        from graph.agent_graph import run_agent
        _agent_graph = run_agent
    return _agent_graph


@router.websocket("/ws/chat/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str):
    await ws_manager.connect(session_id, websocket)
    try:
        while True:
            raw = await websocket.receive()

            # Disconnect frame — break out of loop cleanly
            if raw["type"] == "websocket.disconnect":
                break

            # Handle binary frames (audio)
            if raw["type"] == "websocket.receive" and raw.get("bytes"):
                audio_bytes = raw["bytes"]
                try:
                    from services.stt_service import transcribe_audio
                    transcript = await transcribe_audio(audio_bytes)
                    await ws_manager.send_message(session_id, {
                        "type": "transcript",
                        "content": transcript,
                    })
                    run_agent = _get_agent()
                    await run_agent(session_id, transcript, ws_manager)
                except Exception as e:
                    await ws_manager.send_message(session_id, {
                        "type": "error",
                        "content": f"Audio processing error: {str(e)}",
                    })
                continue

            # Handle text frames
            text = raw.get("text", "")
            if not text:
                continue

            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                data = {"type": "text", "content": text}

            msg_type = data.get("type", "text")
            content = data.get("content", "")

            if msg_type == "cancel":
                await ws_manager.send_message(session_id, {
                    "type": "done",
                    "content": "Cancelled",
                })
                continue

            if not content:
                continue

            try:
                run_agent = _get_agent()
                await run_agent(session_id, content, ws_manager)
            except Exception as e:
                traceback.print_exc()
                await ws_manager.send_message(session_id, {
                    "type": "error",
                    "content": str(e),
                })

    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        ws_manager.disconnect(session_id)
