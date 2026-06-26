"""
Router del Catálogo Maestro de Vinilos — Módulo A (Público).

Endpoints públicos (sin autenticación):
  GET  /api/catalog/          → Listar vinilos aprobados con búsqueda y paginación
  GET  /api/catalog/{id}      → Detalle de un vinilo + precio de mercado Discogs
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from models.vinyl import VinylPublic, VinylStatus
from services import cosmos_service, discogs_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/",
    summary="Listar catálogo público",
    description="Retorna los vinilos aprobados del catálogo maestro. Soporta búsqueda y paginación.",
)
async def list_catalog(
    q: str = Query(default="", description="Término de búsqueda (título, artista, label)"),
    page: int = Query(default=1, ge=1, description="Número de página"),
    per_page: int = Query(default=20, ge=1, le=100, description="Resultados por página"),
    genre: Optional[str] = Query(default=None, description="Filtrar por género"),
    year: Optional[int] = Query(default=None, ge=1877, description="Filtrar por año"),
):
    offset = (page - 1) * per_page
    parameters: list[dict] = [{"name": "@status", "value": VinylStatus.APPROVED.value}]

    conditions = ["c.status = @status"]

    if q:
        conditions.append(
            "(CONTAINS(LOWER(c.title), LOWER(@q)) OR CONTAINS(LOWER(c.artist), LOWER(@q)) OR CONTAINS(LOWER(c.label), LOWER(@q)))"
        )
        parameters.append({"name": "@q", "value": q})

    if genre:
        conditions.append("ARRAY_CONTAINS(c.genre, @genre)")
        parameters.append({"name": "@genre", "value": genre})

    if year:
        conditions.append("c.year = @year")
        parameters.append({"name": "@year", "value": year})

    where_clause = " AND ".join(conditions)

    count_query = f"SELECT VALUE COUNT(1) FROM c WHERE {where_clause}"
    count_results = await cosmos_service.query_items(
        cosmos_service.CONTAINER_VINYLS,
        count_query,
        parameters=parameters,
        partition_key=VinylStatus.APPROVED.value,
    )
    total = count_results[0] if count_results else 0

    data_query = (
        f"SELECT * FROM c WHERE {where_clause} "
        f"ORDER BY c.created_at DESC OFFSET {offset} LIMIT {per_page}"
    )
    items_raw = await cosmos_service.query_items(
        cosmos_service.CONTAINER_VINYLS,
        data_query,
        parameters=parameters,
        partition_key=VinylStatus.APPROVED.value,
    )

    items = [VinylPublic(**item) for item in items_raw]

    return {
        "items": [item.model_dump() for item in items],
        "page": page,
        "per_page": per_page,
        "total": total,
        "query": q,
    }


@router.get(
    "/{vinyl_id}",
    summary="Detalle de un vinilo",
    description="Retorna el detalle completo de un vinilo aprobado, incluyendo precio de mercado de Discogs.",
)
async def get_vinyl_detail(vinyl_id: str):
    results = await cosmos_service.query_items(
        cosmos_service.CONTAINER_VINYLS,
        "SELECT * FROM c WHERE c.id = @id AND c.status = @status",
        parameters=[
            {"name": "@id", "value": vinyl_id},
            {"name": "@status", "value": VinylStatus.APPROVED.value},
        ],
        partition_key=VinylStatus.APPROVED.value,
    )

    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vinilo '{vinyl_id}' no encontrado en el catálogo.",
        )

    vinyl_data = results[0]

    if vinyl_data.get("discogs_id"):
        try:
            stats = await discogs_service.get_marketplace_stats(vinyl_data["discogs_id"])
            if stats:
                vinyl_data["discogs_market_price"] = discogs_service.extract_market_price(stats)
        except Exception as exc:
            logger.warning("No se pudo obtener precio Discogs para %s: %s", vinyl_id, exc)

    return VinylPublic(**vinyl_data).model_dump()
