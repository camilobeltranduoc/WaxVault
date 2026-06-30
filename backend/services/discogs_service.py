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


async def search_masters(
    query: str,
    page: int = 1,
    per_page: int = 20,
    year: Optional[int] = None,
) -> dict:
    """
    Busca master releases en Discogs (un resultado por álbum, sin duplicados de prensado).

    Returns:
        Respuesta JSON con campos 'results' y 'pagination'.
    """
    settings = get_settings()
    params: dict = {
        "q": query,
        "type": "master",
        "page": page,
        "per_page": per_page,
    }
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


async def search_releases(
    query: str,
    page: int = 1,
    per_page: int = 20,
    artist: Optional[str] = None,
    year: Optional[int] = None,
) -> dict:
    """Busca releases individuales (prensados). Usado internamente."""
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


async def get_master(master_id: int) -> Optional[dict]:
    """Obtiene el detalle de un master release (álbum abstracto sin prensado específico)."""
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.discogs_base_url}/masters/{master_id}",
            headers=_get_headers(),
            timeout=10.0,
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()


async def get_master_versions(master_id: int, page: int = 1, per_page: int = 100) -> dict:
    """
    Lista todos los prensados (releases) de un master release.
    Ordenados por año ascendente para mostrar los originales primero.

    Cada versión incluye: id (release_id), format, country, year, label, catno, thumb.
    """
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.discogs_base_url}/masters/{master_id}/versions",
            params={"page": page, "per_page": per_page, "sort": "released", "sort_order": "asc"},
            headers=_get_headers(),
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()


async def get_marketplace_listings(release_id: int, per_page: int = 50) -> dict:
    """
    Obtiene los listings actuales del marketplace para un release específico.
    Se usa para calcular el precio mediano (más representativo que lowest_price).

    Returns:
        Dict con 'listings' (array de listings con price.value) o {} si no disponible.
    """
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.discogs_base_url}/marketplace/search",
            params={
                "release_id": release_id,
                "per_page": per_page,
                "sort": "price",
                "sort_order": "asc",
            },
            headers=_get_headers(),
            timeout=15.0,
        )
        if response.status_code in (404, 422, 403):
            return {}
        response.raise_for_status()
        return response.json()


def calculate_median_price(listings_data: dict) -> Optional[float]:
    """
    Calcula el precio mediano de los listings del marketplace.
    Más representativo que lowest_price para tasar la colección.
    Descarta outliers extremos (top/bottom 10%) si hay suficientes datos.
    """
    listings = listings_data.get("listings", [])
    prices = [
        float(listing["price"]["value"])
        for listing in listings
        if listing.get("price", {}).get("value", 0) > 0
    ]

    if not prices:
        return None

    prices.sort()

    # Con 10+ listings, descartamos el 10% inferior y superior para evitar outliers
    if len(prices) >= 10:
        cut = max(1, len(prices) // 10)
        prices = prices[cut:-cut]

    n = len(prices)
    mid = n // 2
    median = (prices[mid - 1] + prices[mid]) / 2 if n % 2 == 0 else prices[mid]
    return round(median, 2)


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
    Extrae el precio mínimo disponible en el marketplace de Discogs.

    Args:
        stats: Respuesta JSON de get_marketplace_stats().

    Returns:
        Precio mínimo en USD, o None si no hay datos.
    """
    try:
        return stats.get("lowest_price", {}).get("value")
    except (AttributeError, TypeError):
        return None
