"""
Router del Catálogo — Módulo A (Público).

Usa master releases de Discogs: un resultado por álbum en búsqueda,
con la lista de prensados (versions) al ver el detalle.

Endpoints públicos (sin autenticación):
  GET  /api/catalog/          → Buscar masters en Discogs (1 resultado por álbum)
  GET  /api/catalog/{id}      → Detalle del master + lista de versiones/prensados
"""

import logging
import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from models.vinyl import VinylPublic
from services import discogs_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _parse_discogs_title(raw: str) -> tuple[str, str]:
    """Separa 'Artista - Título' en (artist, title). Discogs usa este formato en search."""
    parts = raw.split(" - ", 1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return "Desconocido", raw.strip()


def _clean_artist_name(name: str) -> str:
    """Elimina el sufijo de desambiguación de Discogs: 'Nirvana (2)' → 'Nirvana'."""
    return re.sub(r'\s*\(\d+\)$', '', name).strip()


@router.get(
    "/",
    summary="Buscar álbumes en Discogs",
    description="Retorna master releases (un resultado por álbum, sin duplicados de prensado).",
)
async def list_catalog(
    q: str = Query(default="", description="Término de búsqueda"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=50),
    year: Optional[int] = Query(default=None, ge=1877),
):
    if not q.strip():
        return {"items": [], "page": page, "per_page": per_page, "total": 0, "query": ""}

    try:
        results = await discogs_service.search_masters(
            query=q.strip(),
            page=page,
            per_page=per_page,
            year=year,
        )
    except Exception as exc:
        logger.error("Discogs search error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de búsqueda no disponible. Intenta nuevamente.",
        )

    items = []
    for r in results.get("results", []):
        artist, title = _parse_discogs_title(r.get("title", ""))
        year_str = r.get("year", "")

        vinyl = VinylPublic(
            id=str(r["id"]),
            discogs_id=r["id"],
            title=title,
            artist=artist,
            year=int(year_str) if year_str and str(year_str).isdigit() else None,
            genre=r.get("genre", []),
            style=r.get("style", []),
            cover_image_url=r.get("cover_image") or r.get("thumb"),
        )
        items.append(vinyl)

    pagination = results.get("pagination", {})
    return {
        "items": [item.model_dump() for item in items],
        "page": page,
        "per_page": per_page,
        "total": pagination.get("items", len(items)),
        "query": q,
    }


@router.get(
    "/{master_id}",
    summary="Detalle de un álbum con sus versiones",
    description="Retorna info del master release y la lista de prensados disponibles.",
)
async def get_master_detail(master_id: int):
    try:
        master, versions_data = await _fetch_master_and_versions(master_id)
    except Exception as exc:
        logger.error("Discogs master error for %s: %s", master_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo obtener información del álbum.",
        )

    if not master:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Álbum con Discogs Master ID {master_id} no encontrado.",
        )

    artists = master.get("artists", [])
    artist = _clean_artist_name(artists[0]["name"]) if artists else "Desconocido"

    images = master.get("images", [])
    cover_url = images[0].get("uri") if images else None

    versions = [
        {
            "id": v["id"],
            "format": v.get("format", ""),
            "country": v.get("country", ""),
            "year": v.get("released", ""),
            "label": v.get("label", ""),
            "catno": v.get("catno", ""),
            "thumb": v.get("thumb", ""),
        }
        for v in versions_data.get("versions", [])
        if v.get("format") and "Vinyl" in v.get("major_formats", [])
    ]

    pagination = versions_data.get("pagination", {})

    return {
        "id": str(master_id),
        "discogs_id": master_id,
        "title": master.get("title", ""),
        "artist": artist,
        "year": master.get("year"),
        "genre": master.get("genres", []),
        "style": master.get("styles", []),
        "cover_image_url": cover_url,
        "versions": versions,
        "total_versions": pagination.get("items", len(versions)),
    }


async def _fetch_master_and_versions(master_id: int):
    import asyncio
    master, versions_data = await asyncio.gather(
        discogs_service.get_master(master_id),
        discogs_service.get_master_versions(master_id, per_page=100),
    )
    return master, versions_data
