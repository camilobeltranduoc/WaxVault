"""
Router del Catálogo Maestro de Vinilos — Módulo A (Público).

Endpoints públicos (sin autenticación):
  GET  /api/catalog/          → Listar vinilos aprobados con búsqueda y paginación
  GET  /api/catalog/{id}      → Detalle de un vinilo + precio de mercado Discogs

TODO (próximos módulos):
  - Integrar query real a Cosmos DB container 'vinyls' (status = APPROVED)
  - Llamar a discogs_service.get_marketplace_stats() para precio en tiempo real
  - Añadir filtros: genre, year, country, condition
  - Implementar cache de resultados (Azure Cache for Redis o TTL en Cosmos query)
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

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
    """
    Lista el catálogo público de vinilos aprobados.

    TODO: Reemplazar stub con query a Cosmos DB:
        SELECT * FROM c
        WHERE c.status = 'approved'
        AND CONTAINS(LOWER(c.title), LOWER(@q))
        OFFSET @offset LIMIT @limit
    """
    return {
        "items": [],
        "page": page,
        "per_page": per_page,
        "total": 0,
        "query": q,
    }


@router.get(
    "/{vinyl_id}",
    summary="Detalle de un vinilo",
    description="Retorna el detalle completo de un vinilo aprobado, incluyendo precio de mercado de Discogs.",
)
async def get_vinyl_detail(vinyl_id: str):
    """
    Detalle de un vinilo del catálogo público.

    TODO:
        1. Buscar el vinilo en Cosmos DB por vinyl_id (status = APPROVED)
        2. Si tiene discogs_id, llamar a discogs_service.get_marketplace_stats()
        3. Enriquecer la respuesta con el precio de mercado actualizado
    """
    # Stub — retorna 404 hasta implementar la lógica real
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Vinilo {vinyl_id!r} no encontrado. (Implementación pendiente)",
    )
