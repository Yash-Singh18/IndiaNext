from typing import TypedDict, Optional


class AgentState(TypedDict):
    session_id: str
    query: str
    route: str
    history: list[dict]
    queries: list[str]  # multi-query variants
    retrieved_chunks: list[dict]
    context: str
    sources: list[dict]
    confidence: float
    response: str
    error: Optional[str]
