from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Groq API keys (separate to avoid rate-limit conflicts)
    groq_api_key_main: str = ""
    groq_api_key_stt: str = ""
    groq_api_key_router: str = ""

    # ElevenLabs
    elevenlabs_api_key: str = ""

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""

    # Models
    embedding_model: str = "BAAI/bge-large-en-v1.5"
    reranker_model: str = "BAAI/bge-reranker-large"
    router_llm: str = "llama-3.1-8b-instant"
    main_llm: str = "llama-3.3-70b-versatile"

    # Paths
    models_cache_dir: str = "./models_cache"

    # Chunking
    chunk_min_tokens: int = 200
    chunk_max_tokens: int = 500
    chunk_overlap_tokens: int = 75

    # Retrieval
    top_k_retrieval: int = 20
    top_k_rerank: int = 5

    # Memory
    memory_ttl_seconds: int = 86400  # 24h

    # Context compression
    max_context_tokens: int = 4000

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
