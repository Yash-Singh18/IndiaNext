from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import IngestResponse
from services.ingest_service import ingest_pdf, ingest_pdf_stream

router = APIRouter(prefix="/api", tags=["ingest"])


@router.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf_endpoint(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    try:
        content = await file.read()
        result = await ingest_pdf(content, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.post("/ingest/pdf/stream")
async def ingest_pdf_stream_endpoint(file: UploadFile = File(...)):
    """Stream ingestion progress as newline-delimited JSON (SSE-like)."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    file_name = file.filename

    async def event_stream():
        try:
            async for event in ingest_pdf_stream(content, file_name):
                yield event + "\n"
        except Exception as e:
            import json
            yield json.dumps({"status": "error", "file_name": file_name,
                              "chunks_count": 0, "message": str(e)}) + "\n"

    return StreamingResponse(event_stream(), media_type="application/x-ndjson",
                             headers={"X-Accel-Buffering": "no"})
