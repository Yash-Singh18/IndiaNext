from fastapi import APIRouter, HTTPException
from services.db_service import DBService

router = APIRouter()
db_service = DBService()


@router.get("/api/results/{scan_id}")
async def get_scan_result(scan_id: str):
    result = db_service.get_scan(scan_id)
    if not result:
        raise HTTPException(status_code=404, detail="Scan not found")
    return result


@router.get("/api/results/user/{user_id}")
async def get_user_scans(user_id: str):
    return db_service.get_user_scans(user_id)
