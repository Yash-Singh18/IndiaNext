from sentence_transformers import CrossEncoder

from config.settings import settings


class RerankerService:
    def __init__(self):
        self.model = None

    def load(self):
        if self.model is None:
            self.model = CrossEncoder(
                settings.reranker_model,
                max_length=512,
            )

    def rerank(self, query: str, chunks: list[dict], top_k: int = 5) -> list[dict]:
        self.load()
        if not chunks:
            return []

        pairs = [(query, chunk["text"]) for chunk in chunks]
        scores = self.model.predict(pairs, show_progress_bar=False)

        for chunk, score in zip(chunks, scores):
            chunk["rerank_score"] = float(score)

        ranked = sorted(chunks, key=lambda x: x["rerank_score"], reverse=True)
        return ranked[:top_k]


reranker_service = RerankerService()
