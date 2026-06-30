"""
Modelos Pydantic para entradas de la colección personal de un usuario.

Cada CollectionEntry representa un vinilo que el usuario posee, con metadata
embebida de Discogs (título, artista, portada) para evitar joins costosos.

Diseño de Cosmos DB:
  - Container: "collection"
  - Partition key: /user_id (= b2c_object_id del usuario)
  - Razón: el query dominante es "todos los vinilos de este usuario"
    → single-partition query → costo mínimo en RU/s
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from models.vinyl import VinylCondition


class CollectionEntry(BaseModel):
    """Documento de entrada en la colección personal de un usuario."""
    id: Optional[str] = Field(default=None)
    user_id: str = Field(
        ...,
        description="Partition key — b2c_object_id del propietario de la colección."
    )
    discogs_id: int = Field(
        ...,
        description="ID del release en Discogs. Identificador universal del vinilo."
    )
    title: str = Field(..., description="Título del disco (embebido desde Discogs al agregar).")
    artist: str = Field(..., description="Artista (embebido desde Discogs al agregar).")
    label: Optional[str] = Field(default=None)
    year: Optional[int] = Field(default=None)
    cover_image_url: Optional[str] = Field(
        default=None,
        description="URL de portada de Discogs (embebida al agregar)."
    )
    discogs_market_price: Optional[float] = Field(
        default=None,
        description="Precio mínimo de mercado en Discogs (USD) al momento de agregar."
    )
    condition: VinylCondition = Field(
        default=VinylCondition.VERY_GOOD,
        description="Estado de conservación de ESTA copia específica del disco."
    )
    purchase_price: Optional[float] = Field(
        default=None,
        ge=0,
        description="Precio de compra en USD. Usado para calcular P&L del patrimonio."
    )
    purchase_date: Optional[datetime] = Field(default=None)
    notes: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Notas personales del coleccionista sobre este ejemplar."
    )
    cover_override_url: Optional[str] = Field(
        default=None,
        description="URL de foto de portada subida manualmente por el usuario (Azure Blob)."
    )
    is_for_sale: bool = Field(
        default=False,
        description="El usuario marca si quiere vender este ejemplar."
    )
    asking_price: Optional[float] = Field(
        default=None,
        ge=0,
        description="Precio de venta pedido por el usuario (USD)."
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class CollectionEntryCreate(BaseModel):
    """Payload para agregar un vinilo de Discogs a la colección (POST /api/collection)."""
    discogs_id: int = Field(..., description="ID del release en Discogs.")
    condition: VinylCondition = VinylCondition.VERY_GOOD
    purchase_price: Optional[float] = Field(default=None, ge=0)
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class CollectionEntryUpdate(BaseModel):
    """Payload para actualizar una entrada de colección (PUT /api/collection/{id})."""
    condition: Optional[VinylCondition] = None
    purchase_price: Optional[float] = Field(default=None, ge=0)
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=1000)
    is_for_sale: Optional[bool] = None
    asking_price: Optional[float] = Field(default=None, ge=0)
    cover_override_url: Optional[str] = None


class CollectionSummary(BaseModel):
    """Resumen patrimonial de la colección de un usuario. Usado en el Dashboard."""
    total_items: int
    total_market_value: float
    total_purchase_cost: float
    unrealized_gain: float
    condition_breakdown: dict[str, int]
