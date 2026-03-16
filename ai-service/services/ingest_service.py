import io
import json
from typing import AsyncGenerator

from pypdf import PdfReader

from models.schemas import IngestResponse
from services.chunking_service import chunk_text
from services.embedding_service import embedding_service
from services.vector_store import vector_store


async def ingest_pdf(content: bytes, file_name: str) -> IngestResponse:
    """Non-streaming ingestion (kept for backwards compatibility)."""
    result = None
    async for event in ingest_pdf_stream(content, file_name):
        parsed = json.loads(event)
        if parsed.get("status") in ("success", "warning", "error"):
            result = IngestResponse(**parsed)
    return result or IngestResponse(
        status="error", file_name=file_name, chunks_count=0, message="Unknown error",
    )


async def ingest_pdf_stream(content: bytes, file_name: str) -> AsyncGenerator[str, None]:
    """Stream progress events as JSON lines during ingestion."""
    # Step 1: Extract text from PDF
    reader = PdfReader(io.BytesIO(content))
    total_pages = len(reader.pages)
    yield json.dumps({"step": "extract", "progress": 0, "total_pages": total_pages,
                       "message": f"Extracting text from {total_pages} pages..."})

    all_chunks = []
    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()
        if not text:
            continue
        page_chunks = chunk_text(text, file_name, page_num)
        all_chunks.extend(page_chunks)

        if page_num % 20 == 0 or page_num == total_pages:
            pct = round(page_num / total_pages * 30)  # extraction is 0-30%
            yield json.dumps({"step": "extract", "progress": pct,
                               "message": f"Extracted page {page_num}/{total_pages}"})

    if not all_chunks:
        yield json.dumps({
            "status": "warning", "file_name": file_name,
            "chunks_count": 0, "message": "No text content found in PDF",
        })
        return

    total_chunks = len(all_chunks)
    yield json.dumps({"step": "embed", "progress": 30,
                       "message": f"Embedding {total_chunks} chunks..."})

    # Step 2: Generate embeddings in batches with progress
    batch_size = 64
    texts = [c["text"] for c in all_chunks]
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        batch_embeddings = embedding_service.encode(batch)
        all_embeddings.extend(batch_embeddings)

        done = min(i + batch_size, len(texts))
        pct = 30 + round(done / len(texts) * 50)  # embedding is 30-80%
        yield json.dumps({"step": "embed", "progress": pct,
                           "message": f"Embedded {done}/{total_chunks} chunks"})

    # Step 3: Store in Qdrant
    yield json.dumps({"step": "store", "progress": 80,
                       "message": "Storing in vector database..."})

    vector_store.upsert_chunks(all_chunks, all_embeddings)

    yield json.dumps({"step": "store", "progress": 100,
                       "message": "Done!"})

    yield json.dumps({
        "status": "success", "file_name": file_name,
        "chunks_count": total_chunks,
        "message": f"Ingested {total_chunks} chunks from {total_pages} pages",
    })
