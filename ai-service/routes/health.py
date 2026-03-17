from fastapi import APIRouter
from qdrant_client import QdrantClient
from redis import Redis

from config.settings import settings
from models.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    services = {}

    # Check Qdrant
    try:
        client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port, timeout=2)
        client.get_collections()
        services["qdrant"] = "healthy"
    except Exception:
        services["qdrant"] = "unavailable"

    # Check Redis
    try:
        r = Redis(host=settings.redis_host, port=settings.redis_port, password=settings.redis_password or None, socket_timeout=2)
        r.ping()
        services["redis"] = "healthy"
    except Exception:
        services["redis"] = "unavailable"

    status = "ok" if all(v == "healthy" for v in services.values()) else "degraded"
    return HealthResponse(status=status, services=services)
