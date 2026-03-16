# NorthStar AI Service — Guide

## 1. Running the System

### Prerequisites
- Docker & Docker Compose installed
- Node.js (for frontend)
- 16GB+ RAM (for local BGE models)

### Start everything

```bash
# From project root
docker-compose up --build
```

This starts:
| Service    | URL                        |
|------------|----------------------------|
| AI Service | http://localhost:8000       |
| Qdrant     | http://localhost:6333       |
| Redis      | localhost:6379              |

### Start frontend separately

```bash
cd frontend
npm install
npm run dev
```

### Run AI service without Docker (for dev/debugging)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Make sure Qdrant and Redis are running (via Docker or locally) before starting.

### Health check

```bash
curl http://localhost:8000/api/health
```

Returns status of Qdrant and Redis connections.

---

## 2. Ingesting PDFs

### Single file

```bash
curl -X POST http://localhost:8000/api/ingest/pdf \
  -F "file=@/path/to/your/document.pdf"
```

### Multiple files (bash loop)

```bash
for pdf in /path/to/pdfs/*.pdf; do
  echo "Ingesting: $pdf"
  curl -X POST http://localhost:8000/api/ingest/pdf \
    -F "file=@$pdf"
  echo ""
done
```

### What happens during ingestion

1. PDF text extracted page-by-page (PyPDF)
2. Text split into semantic chunks (200–500 tokens, 75 token overlap)
3. Each chunk embedded with BGE-large-en-v1.5
4. Chunks stored in Qdrant with metadata:
   - `file_name`, `page_number`, `chunk_id`
   - `bm25_tokens` (pre-tokenized for keyword search)

### Response example

```json
{
  "status": "success",
  "file_name": "rural_banking_guide.pdf",
  "chunks_count": 47,
  "message": "Ingested 47 chunks from 12 pages"
}
```

### Re-ingesting a file

Currently, uploading the same filename creates duplicate chunks. To re-ingest cleanly, delete the old data first via the Qdrant API:

```bash
# Delete all chunks from a specific file
curl -X POST http://localhost:6333/collections/northstar_docs/points/delete \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "must": [{"key": "file_name", "match": {"value": "rural_banking_guide.pdf"}}]
      }
  }'
```

Then re-upload the file.

---

## 3. Adding Tools (Future Extension)

The LangGraph agent in `graph/agent_graph.py` supports adding new tool nodes. Here's how:

### Step 1: Create the tool service

Create a new file in `services/`, e.g. `services/db_tool.py`:

```python
# services/db_tool.py

async def query_database(query: str) -> dict:
    """Tool that queries Supabase for structured data."""
    # Your Supabase query logic here
    return {"result": "..."}
```

### Step 2: Add a graph node

In `graph/nodes.py`, add:

```python
async def tool_execute(state: AgentState) -> dict:
    from services.db_tool import query_database
    result = await query_database(state["query"])
    return {"context": str(result), "sources": []}
```

### Step 3: Wire it into the graph

In `graph/agent_graph.py`, register the node and add routing:

```python
from graph.nodes import tool_execute

graph_builder.add_node("tool_execute", tool_execute)

# Update the route_query conditional edges:
graph_builder.add_conditional_edges(
    "route_query",
    _route_decision,
    {
        "rag": "rag_retrieve",
        "tool": "tool_execute",      # new route
        "greeting": "save_memory",
        "general": "save_memory",
    },
)

# Connect tool output back into the flow
graph_builder.add_edge("tool_execute", "aggregate_context")
```

### Step 4: Update the router prompt

In `services/llm_service.py`, update `route_query()` to include the new category:

```python
"- 'tool': needs data from the database (user accounts, transactions, etc.)\n"
```

### Architecture for parallel tools

For parallel retrieval (RAG + DB + tools simultaneously), you can use LangGraph's `Send` API or run multiple nodes concurrently and merge results in `aggregate_context`.

---

## 4. Project Structure

```
ai-service/
├── main.py                    # FastAPI app entry point
├── config/
│   └── settings.py            # All configuration (reads .env)
├── core/
│   └── ws_manager.py          # WebSocket connection lifecycle
├── routes/
│   ├── health.py              # GET /api/health
│   ├── ingest.py              # POST /api/ingest/pdf
│   └── chat.py                # WebSocket /ws/chat/{session_id}
├── services/
│   ├── embedding_service.py   # BGE-large-en-v1.5 embeddings
│   ├── chunking_service.py    # Sentence-based semantic chunking
│   ├── vector_store.py        # Qdrant operations
│   ├── ingest_service.py      # PDF ingestion orchestrator
│   ├── llm_service.py         # Groq API (router + main LLM)
│   ├── bm25_service.py        # BM25 keyword scoring
│   ├── reranker_service.py    # BGE-reranker-large
│   ├── retrieval_service.py   # Full hybrid retrieval pipeline
│   ├── memory_service.py      # Redis conversation memory
│   ├── context_builder.py     # Context formatting + confidence
│   ├── stt_service.py         # Whisper STT via Groq
│   └── tts_service.py         # ElevenLabs TTS
├── graph/
│   ├── state.py               # Agent state TypedDict
│   ├── nodes.py               # Graph node functions
│   └── agent_graph.py         # LangGraph StateGraph definition
├── models/
│   └── schemas.py             # Pydantic request/response models
├── Dockerfile
├── requirements.txt
├── .env                       # API keys (gitignored)
└── .env.example               # Template for .env
```

---

## 5. API Keys

Configured in `ai-service/.env`:

| Key | Used For |
|-----|----------|
| `GROQ_API_KEY_MAIN` | Main LLM (llama-3.3-70b) |
| `GROQ_API_KEY_ROUTER` | Router LLM (llama-3.1-8b) |
| `GROQ_API_KEY_STT` | Whisper STT |
| `ELEVENLABS_API_KEY` | Text-to-speech |

Separate keys avoid rate-limit conflicts between services.

---

## 6. Tuning

| Parameter | File | Default | Notes |
|-----------|------|---------|-------|
| Chunk size | `config/settings.py` | 200–500 tokens | Adjust `chunk_min_tokens` / `chunk_max_tokens` |
| Chunk overlap | `config/settings.py` | 75 tokens | `chunk_overlap_tokens` |
| Retrieval top-k | `config/settings.py` | 20 → rerank to 5 | `top_k_retrieval` / `top_k_rerank` |
| Context limit | `config/settings.py` | 4000 tokens | `max_context_tokens` — triggers compression above this |
| Memory TTL | `config/settings.py` | 24 hours | `memory_ttl_seconds` |
| LLM temperature | `services/llm_service.py` | 0.3 (main), 0.7 (rewrite) | Edit in respective method calls |
