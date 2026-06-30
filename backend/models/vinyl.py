"""
Modelos Pydantic para discos de vinilo.

VinylCondition — Escala estándar de la industria (Goldmine Standard):
  M (Mint) > NM (Near Mint) > VG+ > VG > G+ > G > F (Fair) > P (Poor)

VinylStatus — Ciclo de vida del vinilo en el catálogo:
  PENDING → (admin aprueba) → APPROVED | (admin rechaza) → REJECTED
  APPROVED → (admin archiva) → ARCHIVED
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class VinylCondition(str, Enum):
    """Escala estándar Goldmine de condición de vinilos."""
    MINT = "M"
    NEAR_MINT = "NM"
    VERY_GOOD_PLUS = "VG+"
    VERY_GOOD = "VG"
    GOOD_PLUS = "G+"
    GOOD = "G"
    FAIR = "F"
    POOR = "P"


class VinylStatus(str, Enum):
    """Estado del vinilo en el catálogo maestro."""
    PENDING = "pending"      # Creado por usuario, esperando aprobación admin
    APPROVED = "approved"    # Visible en el catálogo público (Módulo A)
    REJECTED = "rejected"    # Rechazado por el admin en el flujo de aprobación
    ARCHIVED = "archived"    # Eliminado lógicamente del catálogo activo


class Vinyl(BaseModel):
    """
    Documento completo de un vinilo en Cosmos DB.
    Partition key en Cosmos: /status (permite queries eficientes por estado)
    """
    id: Optional[str] = Field(default=None, alias="id")
    discogs_id: Optional[int] = Field(
        default=None,
        description="ID del release en Discogs. None si fue creado manualmente."
    )
    title: str = Field(..., min_length=1, max_length=255)
    artist: str = Field(..., min_length=1, max_length=255)
    label: Optional[str] = Field(default=None, max_length=100)
    year: Optional[int] = Field(default=None, ge=1877, le=2100)  # 1877: primer fonógrafo
    genre: list[str] = Field(default_factory=list)
    style: list[str] = Field(default_factory=list)
    country: Optional[str] = Field(default=None, max_length=100)
    format: Optional[str] = Field(
        default=None,
        max_length=20,
        description="Formato físico: LP, 7\", 12\", EP, etc."
    )
    cover_image_url: Optional[str] = Field(
        default=None,
        description="URL de la portada: Discogs CDN o Azure Blob Storage"
    )
    discogs_market_price: Optional[float] = Field(
        default=None,
        description="Precio mediano del marketplace de Discogs (USD). Se actualiza periódicamente."
    )
    status: VinylStatus = Field(
        default=VinylStatus.PENDING,
        description="Todos los vinilos entran como PENDING hasta aprobación admin."
    )
    created_by_user_id: Optional[str] = Field(
        default=None,
        description="B2C object ID del usuario que creó el registro. None si fue cargado por admin."
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class VinylCreate(BaseModel):
    """Payload para crear un vinilo (POST /api/catalog o POST /api/collection/add-vinyl)."""
    discogs_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    artist: str = Field(..., min_length=1, max_length=255)
    label: Optional[str] = Field(default=None, max_length=100)
    year: Optional[int] = Field(default=None, ge=1877, le=2100)
    genre: list[str] = Field(default_factory=list)
    style: list[str] = Field(default_factory=list)
    country: Optional[str] = Field(default=None, max_length=100)
    format: Optional[str] = Field(default=None, max_length=20)


class VinylUpdate(BaseModel):
    """Payload para actualizar un vinilo. Todos los campos son opcionales (PATCH semántico)."""
    title: Optional[str] = Field(default=None, max_length=255)
    artist: Optional[str] = Field(default=None, max_length=255)
    label: Optional[str] = Field(default=None, max_length=100)
    year: Optional[int] = Field(default=None, ge=1877, le=2100)
    genre: Optional[list[str]] = None
    style: Optional[list[str]] = None
    country: Optional[str] = None
    format: Optional[str] = None
    status: Optional[VinylStatus] = None
    cover_image_url: Optional[str] = None


class VinylPublic(BaseModel):
    """Vista pública de un vinilo (Módulo A). Excluye campos internos."""
    id: str
    discogs_id: Optional[int] = None
    title: str
    artist: str
    label: Optional[str] = None
    year: Optional[int] = None
    genre: list[str] = []
    style: list[str] = []
    country: Optional[str] = None
    format: Optional[str] = None
    cover_image_url: Optional[str] = None
    discogs_market_price: Optional[float] = None
    discogs_num_for_sale: Optional[int] = None
