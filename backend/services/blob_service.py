"""
Servicio de Azure Blob Storage para portadas de vinilos.

Las portadas se almacenan en el container "vinyl-covers" con acceso público
para permitir que el frontend las cargue directamente desde Azure CDN sin
pasar por la API (reduce latencia y costos).

Estructura de blobs:
  vinyl-covers/
    {vinyl_id}/
      {uuid}.jpg    ← portada del catálogo maestro
    user-uploads/
      {user_id}/
        {uuid}.jpg  ← portada personalizada del coleccionista
"""

import logging
import uuid
from typing import BinaryIO, Optional

from azure.storage.blob import ContentSettings
from azure.storage.blob.aio import BlobServiceClient

from config.settings import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_blob_client: Optional[BlobServiceClient] = None


def get_blob_client() -> BlobServiceClient:
    """Retorna el BlobServiceClient singleton."""
    global _blob_client
    if _blob_client is None:
        settings = get_settings()
        _blob_client = BlobServiceClient.from_connection_string(
            settings.blob_storage_connection_string
        )
        logger.info("Blob Storage client initialized.")
    return _blob_client


# ---------------------------------------------------------------------------
# Operaciones
# ---------------------------------------------------------------------------

async def upload_cover_image(
    file_data: BinaryIO,
    content_type: str,
    vinyl_id: str,
) -> str:
    """
    Sube la portada de un vinilo del catálogo maestro.

    Args:
        file_data: Objeto de archivo (bytes-like) de la portada.
        content_type: MIME type (ej. "image/jpeg", "image/png").
        vinyl_id: ID del vinilo en Cosmos DB.

    Returns:
        URL pública del blob subido.
    """
    settings = get_settings()
    client = get_blob_client()
    container_client = client.get_container_client(settings.blob_container_covers)

    blob_name = f"{vinyl_id}/{uuid.uuid4()}.jpg"
    blob_client = container_client.get_blob_client(blob_name)

    await blob_client.upload_blob(
        file_data,
        blob_type="BlockBlob",
        content_settings=ContentSettings(content_type=content_type),
        overwrite=True,
    )

    logger.info("Cover uploaded: %s", blob_client.url)
    return blob_client.url


async def upload_user_cover(
    file_data: BinaryIO,
    content_type: str,
    user_id: str,
) -> str:
    """
    Sube una portada personalizada del coleccionista (Módulo B).

    Returns:
        URL pública del blob subido.
    """
    settings = get_settings()
    client = get_blob_client()
    container_client = client.get_container_client(settings.blob_container_covers)

    blob_name = f"user-uploads/{user_id}/{uuid.uuid4()}.jpg"
    blob_client = container_client.get_blob_client(blob_name)

    await blob_client.upload_blob(
        file_data,
        blob_type="BlockBlob",
        content_settings=ContentSettings(content_type=content_type),
        overwrite=True,
    )

    return blob_client.url


async def delete_blob_by_url(blob_url: str) -> None:
    """
    Elimina un blob dado su URL completa.

    TODO: Parsear el blob_name desde la URL y llamar a delete_blob().
    """
    # Implementación pendiente — extraer blob_name de la URL
    logger.info("delete_blob_by_url stub called: %s", blob_url)
