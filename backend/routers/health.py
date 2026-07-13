"""
Router de Health Check — GET /api/health/

Endpoints:
  GET /api/health/        → Liveness check (siempre 200 si el proceso corre)
  GET /api/health/ready   → Readiness check (verificará Cosmos DB y Blob en el futuro)

Usados por:
  - Azure Load Balancer para determinar si la instancia está viva
  - Scripts de CI/CD para verificar que el despliegue fue exitoso
  - Pruebas de smoke test post-deploy
"""

from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    environment: str


class ReadinessResponse(BaseModel):
    status: str
    checks: dict[str, str]


@router.get("", include_in_schema=False)
@router.get(
    "/",
    response_model=HealthResponse,
    summary="Liveness check",
    description="Verifica que el proceso de la Azure Function está corriendo.",
)
async def health_check() -> HealthResponse:
    from config.settings import get_settings
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="1.0.0",
        environment=settings.environment,
    )


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Readiness check",
    description="Verifica que los servicios dependientes (Cosmos DB, Blob) están accesibles.",
)
async def readiness_check() -> ReadinessResponse:
    """
    TODO: Implementar pings reales a Cosmos DB y Blob Storage.
    Por ahora retorna 'ready' inmediatamente (stub).
    """
    checks = {
        "cosmos_db": "ok (stub)",
        "blob_storage": "ok (stub)",
        "discogs_api": "ok (stub)",
    }
    return ReadinessResponse(status="ready", checks=checks)
