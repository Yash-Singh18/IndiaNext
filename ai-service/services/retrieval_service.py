import asyncio
import concurrent.futures
import time

from services.embedding_service import embedding_service
from services.vector_store import vector_store
from services.bm25_service import bm25_score_chunks
from services.llm_service import llm_service
from config.settings import settings

# Thread pool for CPU-bound work (embedding, reranking)
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)


async def retrieve(query: str, history: list[dict]) -> list[dict]:
    """
    Full hybrid retrieval pipeline (optimised for speed):
    1. Vector search on original query  +  query-rewrite (parallel)
    2. BM25 search
    3. Merge & deduplicate
    4. Rerank top candidates
    """
    t0 = time.time()
    loop = asyncio.get_event_loop()

    # Cap how many candidates reach the expensive reranker
    MAX_RERANK_CANDIDATES = 15

    # --- kick off query rewrite AND original-query vector search in parallel ---
    rewrite_task = asyncio.create_task(_safe_rewrite(query, history))

    # vector search on original query immediately (don't wait for rewrites)
    try:
        q_embedding = await loop.run_in_executor(
            _executor, embedding_service.encode_query, query
        )
        original_results = vector_store.search(q_embedding, top_k=10)
    except Exception:
        original_results = []

    all_vector_results = {}
    for r in original_results:
        all_vector_results[r["chunk_id"]] = r

    # wait for rewrites, then do vector search on variant queries
    variant_queries = await rewrite_task
    for q in variant_queries:
        try:
            q_emb = await loop.run_in_executor(
                _executor, embedding_service.encode_query, q
            )
            results = vector_store.search(q_emb, top_k=10)
            for r in results:
                cid = r["chunk_id"]
                if cid not in all_vector_results or r["score"] > all_vector_results[cid]["score"]:
                    all_vector_results[cid] = r
        except Exception:
            continue

    # BM25 search
    try:
        all_chunks = vector_store.get_all_chunks()
        bm25_results = bm25_score_chunks(query, all_chunks)
        bm25_top = bm25_results[:10]
    except Exception:
        bm25_top = []

    # Merge (union by chunk_id)
    merged = dict(all_vector_results)
    for chunk in bm25_top:
        cid = chunk["chunk_id"]
        if cid not in merged:
            merged[cid] = chunk

    candidates = list(merged.values())
    if not candidates:
        return []

    # Sort by vector score and return top results
    # Skip the CrossEncoder reranker — it takes 30+ seconds on CPU
    # and vector cosine similarity is good enough for quality retrieval
    candidates.sort(key=lambda c: c.get("score", 0), reverse=True)
    top = candidates[:settings.top_k_rerank]

    # Set rerank_score from vector score so confidence estimation still works
    for c in top:
        c["rerank_score"] = c.get("score", 0) * 10  # scale to reranker range

    print(f"[retrieve] done in {time.time()-t0:.2f}s  ({len(candidates)} candidates -> {len(top)} results)", flush=True)
    return top


async def _safe_rewrite(query: str, history: list[dict]) -> list[str]:
    try:
        variants = await llm_service.rewrite_query(query, history)
        # exclude the original (already searched) — return only rewrites
        return [q for q in variants[1:] if q.strip()]
    except Exception:
        return []
