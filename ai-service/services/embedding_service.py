import numpy as np
from sentence_transformers import SentenceTransformer

from config.settings import settings


class EmbeddingService:
    def __init__(self):
        self.model = None

    def load(self):
        if self.model is None:
            self.model = SentenceTransformer(
                settings.embedding_model,
                cache_folder=settings.models_cache_dir,
            )

    def encode(self, texts: list[str]) -> list[list[float]]:
        self.load()
        # BGE models recommend prepending "Represent this sentence:" for retrieval
        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.tolist()

    def encode_query(self, query: str) -> list[float]:
        self.load()
        # BGE recommends different prefix for queries
        embedding = self.model.encode(
            f"Represent this sentence for searching relevant passages: {query}",
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embedding.tolist()

    @property
    def dimension(self) -> int:
        self.load()
        return self.model.get_sentence_embedding_dimension()


embedding_service = EmbeddingService()
