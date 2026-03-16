from fastapi import APIRouter, UploadFile, File, HTTPException

from models.schemas import IngestResponse
from services.ingest_service import ingest_pdf

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
