from services.chunking_service import count_tokens
from config.settings import settings


def build_context(chunks: list[dict], query: str) -> tuple[str, list[dict]]:
    """
    Build formatted context from retrieved chunks.
    Returns (context_string, source_citations).
    """
    if not chunks:
        return "", []

    context_parts = []
    sources = []

    for i, chunk in enumerate(chunks):
        source = {
            "file_name": chunk.get("file_name", "unknown"),
            "page_number": chunk.get("page_number", 0),
            "chunk_id": chunk.get("chunk_id", ""),
            "text_preview": chunk.get("text", "")[:150] + "...",
        }
        sources.append(source)

        context_parts.append(
            f"[Source {i+1}: {source['file_name']}, Page {source['page_number']}]\n"
            f"{chunk['text']}\n"
        )

    context = "\n---\n".join(context_parts)
    return context, sources


def build_rag_prompt(context: str, sources: list[dict]) -> str:
    """Build the system prompt for RAG generation."""
    return (
        "You are NorthStar AI, a helpful assistant for rural financial services in India. "
        "Answer the user's question based on the provided context from uploaded documents.\n\n"
        "RULES:\n"
        "- Answer ONLY based on the provided context. If the context doesn't contain relevant information, say so.\n"
        "- Cite your sources using [Source N] notation.\n"
        "- Be concise and accurate.\n"
        "- If the user asks in Hindi, respond in Hindi using Devanagari script ONLY. NEVER use Urdu or Nastaliq/Arabic script.\n"
        "- For other Indian languages, respond in that language using its native script.\n"
        "- For financial advice, always add appropriate disclaimers.\n\n"
        f"CONTEXT:\n{context}\n\n"
        "Answer the user's question based on the above context."
    )


def estimate_confidence(chunks: list[dict]) -> float:
    """Estimate confidence based on reranker scores."""
    if not chunks:
        return 0.0

    scores = [c.get("rerank_score", 0.0) for c in chunks]
    avg_score = sum(scores) / len(scores)

    # Normalize to 0-1 range (reranker scores are typically -10 to 10)
    confidence = max(0.0, min(1.0, (avg_score + 5) / 10))
    return round(confidence, 2)
