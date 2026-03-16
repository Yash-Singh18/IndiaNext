import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure we load .env from the right place
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload embedding + reranker models
    print("Loading embedding model...")
    from services.embedding_service import embedding_service
    embedding_service.load()
    print("Embedding model ready.")

    print("Loading reranker model...")
    from services.reranker_service import reranker_service
    reranker_service.load()
    print("Reranker model ready.")

    # Ensure Qdrant collection exists
    from services.vector_store import vector_store
    vector_store.ensure_collection()
    print("Qdrant collection ready.")

    yield

    print("Shutting down...")


app = FastAPI(title="NorthStar AI Agent", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
from routes.health import router as health_router
from routes.ingest import router as ingest_router
from routes.chat import router as chat_router

app.include_router(health_router)
app.include_router(ingest_router)
app.include_router(chat_router)
