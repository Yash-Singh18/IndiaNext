from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    status: str = "ok"
    services: dict[str, str] = {}


class IngestResponse(BaseModel):
    status: str
    file_name: str
    chunks_count: int
    message: str


class ChatMessage(BaseModel):
    type: str  # "text", "audio", "cancel"
    content: Optional[str] = None
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    type: str  # "token", "sources", "done", "error", "audio"
    content: Optional[str] = None
    sources: Optional[list[dict]] = None
    confidence: Optional[float] = None


class SourceCitation(BaseModel):
    file_name: str
    page_number: int
    chunk_id: str
    text_preview: str


class ChunkMetadata(BaseModel):
    file_name: str
    page_number: int
    chunk_id: str
    text: str
    bm25_tokens: list[str] = []
