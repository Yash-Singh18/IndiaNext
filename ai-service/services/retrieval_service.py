from services.embedding_service import embedding_service
from services.vector_store import vector_store
from services.bm25_service import bm25_score_chunks
from services.reranker_service import reranker_service
from services.llm_service import llm_service
from config.settings import settings


async def retrieve(query: str, history: list[dict]) -> list[dict]:
    """
    Full hybrid retrieval pipeline:
    1. Query rewrite -> multi-query
    2. Vector search + BM25 search (hybrid)
    3. Merge & deduplicate
    4. Rerank with BGE-reranker
    5. Return top-k results
    """
    # Step 1: Generate multiple query variants
    queries = await llm_service.rewrite_query(query, history)

    # Step 2: Vector search across all query variants
    all_vector_results = {}
    for q in queries:
        q_embedding = embedding_service.encode_query(q)
        results = vector_store.search(q_embedding, top_k=settings.top_k_retrieval)
        for r in results:
            cid = r["chunk_id"]
            if cid not in all_vector_results or r["score"] > all_vector_results[cid]["score"]:
                all_vector_results[cid] = r

    # Step 3: BM25 search using stored tokens
    all_chunks = vector_store.get_all_chunks()
    bm25_results = bm25_score_chunks(query, all_chunks)
    bm25_top = bm25_results[:settings.top_k_retrieval]

    # Step 4: Merge results (union by chunk_id, keep max scores)
    merged = dict(all_vector_results)  # chunk_id -> chunk
    for chunk in bm25_top:
        cid = chunk["chunk_id"]
        if cid not in merged:
            merged[cid] = chunk

    candidates = list(merged.values())

    if not candidates:
        return []

    # Step 5: Rerank
    reranked = reranker_service.rerank(query, candidates, top_k=settings.top_k_rerank)

    return reranked
