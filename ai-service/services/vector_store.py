from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance,
    PointStruct,
    VectorParams,
    Filter,
    FieldCondition,
    MatchValue,
)

from config.settings import settings

COLLECTION_NAME = "northstar_docs"


class VectorStore:
    def __init__(self):
        self.client = QdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
        )

    def ensure_collection(self):
        collections = [c.name for c in self.client.get_collections().collections]
        if COLLECTION_NAME not in collections:
            from services.embedding_service import embedding_service
            self.client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=embedding_service.dimension,
                    distance=Distance.COSINE,
                ),
            )

    def upsert_chunks(self, chunks: list[dict], embeddings: list[list[float]]):
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point_id = abs(hash(chunk["chunk_id"])) % (2**63)
            points.append(PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "chunk_id": chunk["chunk_id"],
                    "text": chunk["text"],
                    "file_name": chunk["file_name"],
                    "page_number": chunk["page_number"],
                    "bm25_tokens": chunk["bm25_tokens"],
                },
            ))

        # Batch upsert (100 at a time)
        batch_size = 100
        for i in range(0, len(points), batch_size):
            self.client.upsert(
                collection_name=COLLECTION_NAME,
                points=points[i:i + batch_size],
            )

    def search(self, query_vector: list[float], top_k: int = 20) -> list[dict]:
        results = self.client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            limit=top_k,
        )
        return [
            {**hit.payload, "score": hit.score}
            for hit in results
        ]

    def get_all_chunks(self, limit: int = 10000) -> list[dict]:
        """Fetch all chunks for BM25 scoring."""
        results = self.client.scroll(
            collection_name=COLLECTION_NAME,
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )
        return [point.payload for point in results[0]]

    def delete_by_file(self, file_name: str):
        self.client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[FieldCondition(key="file_name", match=MatchValue(value=file_name))]
            ),
        )


vector_store = VectorStore()
