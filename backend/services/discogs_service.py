"""
Servicio de integración con la API de Discogs.

Discogs es la base de datos de música más grande del mundo. Provee:
  - Metadata de releases (artista, año, label, género, tracklist, etc.)
  - Precios de mercado en tiempo real (lowest, median, highest)

Autenticación: Personal Access Token (más simple que OAuth para uso server-side).
Rate limit: 60 requests/min para usuarios autenticados.

Docs: https://www.discogs.com/developers/
"""

import logging
from typing import Optional

import httpx

from config.settings import get_settings

logger = logging.getLogger(__name__)


def _get_headers() -> dict[str, str]:
    """Headers requeridos por la API de Discogs."""
    settings = get_settings()
    return {
        "Authorization": f"Discogs token={settings.discogs_api_token}",
        # User-Agent requerido por Discogs — usar nombre de la app y contacto
        "User-Agent": "WaxVault/1.0 +https://github.com/waxvault",
        "Accept": "application/json",
    }


async def search_releases(
    query: str,
    page: int = 1,
    per_page: int = 20,
    artist: Optional[str] = None,
    year: Optional[int] = None,
) -> dict:
    """
    Busca releases en la base de datos de Discogs.

    Args:
        query: Término de búsqueda libre.
        page: Página de resultados (base 1).
        per_page: Resultados por página (máx. 100).
        artist: Filtro opcional por artista.
        year: Filtro opcional por año.

    Returns:
        Respuesta JSON de Discogs con campos 'results' y 'pagination'.
    """
    settings = get_settings()
    params: dict = {
        "q": query,
        "type": "release",
        "page": page,
        "per_page": per_page,
    }
    if artist:
        params["artist"] = artist
    if year:
        params["year"] = year

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.discogs_base_url}/database/search",
            params=params,
            headers=_get_headers(),
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()


async def get_release(release_id: int) -> Optional[dict]:
    """
    Obtiene el detalle completo de un release de Discogs.

    Returns:
        Diccionario con metadata del release, o None si no existe.
    """
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.discogs_base_url}/releases/{release_id}",
            headers=_get_headers(),
            timeout=10.0,
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()


async def get_marketplace_stats(release_id: int) -> Optional[dict]:
    """
    Obtiene estadísticas de precio del marketplace de Discogs para un release.

    Returns:
        Diccionario con lowest_price, num_for_sale, blocked_from_sale, etc.
        Campos relevantes:
          - lowest_price.value: precio más bajo disponible (USD)
          - num_for_sale: cantidad de copias a la venta
    """
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.discogs_base_url}/marketplace/stats/{release_id}",
            headers=_get_headers(),
            timeout=10.0,
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()


def extract_market_price(stats: dict) -> Optional[float]:
    """
    Extrae el precio mediano de la respuesta de marketplace stats.

    Args:
        stats: Respuesta JSON de get_marketplace_stats().

    Returns:
        Precio mediano en USD, o None si no hay datos.
    """
    try:
        return stats.get("lowest_price", {}).get("value")
    except (AttributeError, TypeError):
        return None
