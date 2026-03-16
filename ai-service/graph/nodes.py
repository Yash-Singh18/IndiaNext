import time

from graph.state import AgentState
from services.memory_service import memory_service
from services.llm_service import llm_service
from services.retrieval_service import retrieve
from services.context_builder import build_context, build_rag_prompt, estimate_confidence
from services.chunking_service import count_tokens
from config.settings import settings


async def load_memory(state: AgentState) -> dict:
    """Load conversation history from Redis."""
    t = time.time()
    history = memory_service.get_history(state["session_id"])
    print(f"[node] load_memory: {time.time()-t:.2f}s")
    return {"history": history}


async def route_query(state: AgentState) -> dict:
    """Route the query using the router LLM."""
    t = time.time()
    route = await llm_service.route_query(state["query"])
    print(f"[node] route_query -> {route}: {time.time()-t:.2f}s")
    return {"route": route}


async def rag_retrieve(state: AgentState) -> dict:
    """Run the full hybrid retrieval pipeline."""
    t = time.time()
    chunks = await retrieve(state["query"], state["history"])
    print(f"[node] rag_retrieve: {time.time()-t:.2f}s ({len(chunks)} chunks)")
    return {"retrieved_chunks": chunks}


async def aggregate_context(state: AgentState) -> dict:
    """Build context from retrieved chunks."""
    chunks = state["retrieved_chunks"]
    context, sources = build_context(chunks, state["query"])
    confidence = estimate_confidence(chunks)
    return {
        "context": context,
        "sources": sources,
        "confidence": confidence,
    }


async def compress_context(state: AgentState) -> dict:
    """Compress context if it exceeds token limits."""
    context = state["context"]
    if count_tokens(context) > settings.max_context_tokens:
        compressed = await llm_service.compress_context(context, state["query"])
        return {"context": compressed}
    return {}


async def generate_response(state: AgentState) -> dict:
    """Generate the final response (non-streaming, for state tracking)."""
    # This is a placeholder - actual streaming happens in agent_graph.run_agent
    return {"response": ""}


async def save_memory(state: AgentState) -> dict:
    """Save the conversation turn to Redis."""
    memory_service.add_message(state["session_id"], "user", state["query"])
    if state.get("response"):
        memory_service.add_message(state["session_id"], "assistant", state["response"])
    return {}
