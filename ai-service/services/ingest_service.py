import io

from pypdf import PdfReader

from models.schemas import IngestResponse
from services.chunking_service import chunk_text
from services.embedding_service import embedding_service
from services.vector_store import vector_store


async def ingest_pdf(content: bytes, file_name: str) -> IngestResponse:
    # Extract text from PDF
    reader = PdfReader(io.BytesIO(content))
    all_chunks = []

    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()
        if not text:
            continue

        page_chunks = chunk_text(text, file_name, page_num)
        all_chunks.extend(page_chunks)

    if not all_chunks:
        return IngestResponse(
            status="warning",
            file_name=file_name,
            chunks_count=0,
            message="No text content found in PDF",
        )

    # Generate embeddings
    texts = [c["text"] for c in all_chunks]
    embeddings = embedding_service.encode(texts)

    # Store in Qdrant
    vector_store.upsert_chunks(all_chunks, embeddings)

    return IngestResponse(
        status="success",
        file_name=file_name,
        chunks_count=len(all_chunks),
        message=f"Ingested {len(all_chunks)} chunks from {len(reader.pages)} pages",
    )
