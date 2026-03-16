from langgraph.graph import StateGraph, END

from graph.state import AgentState
from graph.nodes import (
    load_memory,
    route_query,
    rag_retrieve,
    aggregate_context,
    compress_context,
    save_memory,
)
from services.llm_service import llm_service
from services.context_builder import build_rag_prompt
from services.memory_service import memory_service
from core.ws_manager import WebSocketManager


def _route_decision(state: AgentState) -> str:
    route = state.get("route", "rag")
    if route == "greeting":
        return "greeting"
    elif route == "general":
        return "general"
    return "rag"


# Build the graph
graph_builder = StateGraph(AgentState)

graph_builder.add_node("load_memory", load_memory)
graph_builder.add_node("route_query", route_query)
graph_builder.add_node("rag_retrieve", rag_retrieve)
graph_builder.add_node("aggregate_context", aggregate_context)
graph_builder.add_node("compress_context", compress_context)
graph_builder.add_node("save_memory", save_memory)

graph_builder.set_entry_point("load_memory")
graph_builder.add_edge("load_memory", "route_query")

graph_builder.add_conditional_edges(
    "route_query",
    _route_decision,
    {
        "rag": "rag_retrieve",
        "greeting": "save_memory",
        "general": "save_memory",
    },
)

graph_builder.add_edge("rag_retrieve", "aggregate_context")
graph_builder.add_edge("aggregate_context", "compress_context")
graph_builder.add_edge("compress_context", "save_memory")
graph_builder.add_edge("save_memory", END)

agent_graph = graph_builder.compile()


async def run_agent(session_id: str, query: str, ws_manager: WebSocketManager):
    """Execute the agent graph and stream the response over WebSocket."""
    initial_state: AgentState = {
        "session_id": session_id,
        "query": query,
        "route": "",
        "history": [],
        "queries": [],
        "retrieved_chunks": [],
        "context": "",
        "sources": [],
        "confidence": 0.0,
        "response": "",
        "error": None,
    }

    full_response = ""

    try:
        # Run the graph
        final_state = await agent_graph.ainvoke(initial_state)

        route = final_state.get("route", "rag")
        history = final_state.get("history", [])

        # Stream response based on route
        if route == "greeting":
            system_prompt = (
                "You are NorthStar AI, a friendly financial assistant for rural India. "
                "Respond warmly to the greeting. Keep it brief and friendly. "
                "If the user speaks Hindi, respond in Hindi using Devanagari script only. "
                "NEVER use Urdu or Nastaliq/Arabic script. Always use Devanagari (e.g. नमस्ते, not نمستے)."
            )
            async for token in llm_service.generate_stream(system_prompt, query, history):
                full_response += token
                await ws_manager.send_message(session_id, {
                    "type": "token",
                    "content": token,
                })

        elif route == "general":
            system_prompt = (
                "You are NorthStar AI, a knowledgeable financial assistant for rural India. "
                "Answer general knowledge questions helpfully and accurately. "
                "If the question is about financial topics, provide useful context. "
                "If the user speaks Hindi, respond in Hindi using Devanagari script only. "
                "NEVER use Urdu or Nastaliq/Arabic script. Always use Devanagari (e.g. नमस्ते, not نمستے)."
            )
            async for token in llm_service.generate_stream(system_prompt, query, history):
                full_response += token
                await ws_manager.send_message(session_id, {
                    "type": "token",
                    "content": token,
                })

        else:  # RAG
            context = final_state.get("context", "")
            sources = final_state.get("sources", [])
            confidence = final_state.get("confidence", 0.0)

            if not context:
                await ws_manager.send_message(session_id, {
                    "type": "token",
                    "content": "Upload a relevant document for a grounded answer with citations, "
                               "or ask a general question and I will answer directly.",
                })
                full_response = (
                    "Upload a relevant document for a grounded answer with citations, "
                    "or ask a general question and I will answer directly."
                )
            else:
                system_prompt = build_rag_prompt(context, sources)
                async for token in llm_service.generate_stream(system_prompt, query, history):
                    full_response += token
                    await ws_manager.send_message(session_id, {
                        "type": "token",
                        "content": token,
                    })

                # Send sources after response
                await ws_manager.send_message(session_id, {
                    "type": "sources",
                    "sources": sources,
                    "confidence": confidence,
                })

        # Save assistant response to memory
        memory_service.add_message(session_id, "assistant", full_response)

    except Exception as e:
        import traceback
        traceback.print_exc()
        await ws_manager.send_message(session_id, {
            "type": "error",
            "content": f"Sorry, I encountered an error processing your request. Please try again.",
        })
    finally:
        # Always send done signal so the frontend never gets stuck
        await ws_manager.send_message(session_id, {
            "type": "done",
            "content": "",
        })
