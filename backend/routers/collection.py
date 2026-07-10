"""
Router de Colección Personal — Módulo B (Coleccionista autenticado).

La colección almacena solo los vinilos que el usuario posee, con metadata
embebida de Discogs (título, artista, portada). No requiere joins a vinyls container.

Endpoints:
  GET    /api/collection/           → Lista la colección del usuario autenticado
  GET    /api/collection/dashboard  → Resumen patrimonial (valor total, ganancia, etc.)
  POST   /api/collection/           → Agrega vinilo de Discogs a la colección
  PUT    /api/collection/{id}       → Actualiza una entrada (condición, precio, notas)
  DELETE /api/collection/{id}       → Elimina una entrada de la colección
  POST   /api/collection/{id}/cover → Sube portada personalizada a Azure Blob
"""

import logging
import re
import uuid
from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from middleware.auth_middleware import CurrentUser, get_current_user
from models.collection import CollectionEntry, CollectionEntryCreate, CollectionEntryUpdate
from services import blob_service, cosmos_service, discogs_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _clean_artist_name(name: str) -> str:
    return re.sub(r'\s*\(\d+\)$', '', name).strip()


@router.get(
    "/dashboard",
    summary="Dashboard patrimonial",
    description="Resumen de valor total de la colección con historial de tasación.",
)
async def get_dashboard(current_user: CurrentUser = Depends(get_current_user)):
    entries = await cosmos_service.query_items(
        cosmos_service.CONTAINER_COLLECTION,
        "SELECT * FROM c WHERE c.user_id = @user_id ORDER BY c.created_at ASC",
        parameters=[{"name": "@user_id", "value": current_user.user_id}],
        partition_key=current_user.user_id,
    )

    if not entries:
        return {
            "total_items": 0,
            "total_market_value": 0.0,
            "total_purchase_cost": 0.0,
            "unrealized_gain": 0.0,
            "condition_breakdown": {},
            "valuation_history": [],
        }

    total_market_value = sum(e.get("discogs_market_price") or 0.0 for e in entries)
    total_purchase_cost = sum(e.get("purchase_price") or 0.0 for e in entries)
    condition_breakdown: dict[str, int] = defaultdict(int)

    for entry in entries:
        condition_breakdown[entry.get("condition", "VG")] += 1

    monthly_accumulator: dict[str, float] = defaultdict(float)
    running_value = 0.0
    for entry in entries:
        market_price = entry.get("discogs_market_price") or (entry.get("purchase_price") or 0.0)
        running_value += market_price
        created = entry.get("created_at", "")
        month_key = created[:7] if isinstance(created, str) else created.strftime("%Y-%m")
        monthly_accumulator[month_key] = running_value

    valuation_history = [
        {"month": month, "value": round(value, 2)}
        for month, value in sorted(monthly_accumulator.items())
    ]

    return {
        "total_items": len(entries),
        "total_market_value": round(total_market_value, 2),
        "total_purchase_cost": round(total_purchase_cost, 2),
        "unrealized_gain": round(total_market_value - total_purchase_cost, 2),
        "condition_breakdown": dict(condition_breakdown),
        "valuation_history": valuation_history,
    }


@router.get("", include_in_schema=False)
@router.get(
    "/",
    summary="Listar mi colección",
    description="Retorna todos los vinilos en la colección del usuario autenticado.",
)
async def list_collection(current_user: CurrentUser = Depends(get_current_user)):
    entries = await cosmos_service.query_items(
        cosmos_service.CONTAINER_COLLECTION,
        "SELECT * FROM c WHERE c.user_id = @user_id ORDER BY c.created_at DESC",
        parameters=[{"name": "@user_id", "value": current_user.user_id}],
        partition_key=current_user.user_id,
    )
    return {
        "items": entries,
        "total": len(entries),
        "user_id": current_user.user_id,
    }


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Agregar a mi colección",
    description="Si lleva discogs_id busca en Discogs; sin él acepta title+artist como entrada manual.",
)
async def add_to_collection(
    body: CollectionEntryCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    if body.discogs_id:
        # --- Flujo Discogs ---
        release = await discogs_service.get_release(body.discogs_id)
        if not release:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vinilo con Discogs ID {body.discogs_id} no encontrado.",
            )

        artists = release.get("artists", [])
        artist = _clean_artist_name(artists[0]["name"]) if artists else "Desconocido"
        images = release.get("images", [])
        cover_url = images[0].get("uri") if images else None
        labels = release.get("labels", [])
        label = labels[0]["name"] if labels else None

        market_price: float | None = None
        try:
            listings_data = await discogs_service.get_marketplace_listings(body.discogs_id)
            market_price = discogs_service.calculate_median_price(listings_data)
        except Exception as exc:
            logger.warning("Marketplace listings no disponible para %s: %s", body.discogs_id, exc)

        if market_price is None:
            try:
                stats = await discogs_service.get_marketplace_stats(body.discogs_id)
                if stats:
                    market_price = discogs_service.extract_market_price(stats)
            except Exception as exc:
                logger.warning("No se pudo obtener precio Discogs para %s: %s", body.discogs_id, exc)

        new_entry = CollectionEntry(
            id=str(uuid.uuid4()),
            user_id=current_user.user_id,
            discogs_id=body.discogs_id,
            title=release.get("title", ""),
            artist=artist,
            label=label,
            year=release.get("year"),
            cover_image_url=cover_url,
            discogs_market_price=market_price,
            condition=body.condition,
            purchase_price=body.purchase_price,
            purchase_date=body.purchase_date,
            notes=body.notes,
        )
    else:
        # --- Flujo manual (sin Discogs) ---
        if not body.title or not body.artist:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Para entradas manuales se requieren título y artista.",
            )
        new_entry = CollectionEntry(
            id=str(uuid.uuid4()),
            user_id=current_user.user_id,
            discogs_id=None,
            title=body.title.strip(),
            artist=body.artist.strip(),
            label=body.label,
            year=body.year,
            condition=body.condition,
            purchase_price=body.purchase_price,
            purchase_date=body.purchase_date,
            notes=body.notes,
        )

    saved = await cosmos_service.upsert_item(
        cosmos_service.CONTAINER_COLLECTION,
        new_entry.model_dump(mode="json"),
    )
    return saved


@router.put(
    "/{entry_id}",
    summary="Actualizar entrada de colección",
    description="Actualiza la condición, precio de compra, notas u otros campos.",
)
async def update_collection_entry(
    entry_id: str,
    update: CollectionEntryUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    results = await cosmos_service.query_items(
        cosmos_service.CONTAINER_COLLECTION,
        "SELECT * FROM c WHERE c.id = @id AND c.user_id = @user_id",
        parameters=[
            {"name": "@id", "value": entry_id},
            {"name": "@user_id", "value": current_user.user_id},
        ],
        partition_key=current_user.user_id,
    )
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada o no pertenece al usuario.",
        )

    existing = results[0]
    patch = update.model_dump(exclude_none=True)
    patch["updated_at"] = datetime.utcnow().isoformat()
    existing.update(patch)

    saved = await cosmos_service.upsert_item(cosmos_service.CONTAINER_COLLECTION, existing)
    return saved


@router.delete(
    "/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar de mi colección",
)
async def delete_collection_entry(
    entry_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    results = await cosmos_service.query_items(
        cosmos_service.CONTAINER_COLLECTION,
        "SELECT * FROM c WHERE c.id = @id AND c.user_id = @user_id",
        parameters=[
            {"name": "@id", "value": entry_id},
            {"name": "@user_id", "value": current_user.user_id},
        ],
        partition_key=current_user.user_id,
    )
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada no encontrada o no pertenece al usuario.",
        )

    await cosmos_service.delete_item(
        cosmos_service.CONTAINER_COLLECTION,
        entry_id,
        partition_key=current_user.user_id,
    )
    return None


@router.post(
    "/{entry_id}/cover",
    summary="Subir portada personalizada",
    description="Sube una imagen de portada personalizada para una entrada de la colección.",
)
async def upload_vinyl_cover(
    entry_id: str,
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se aceptan imágenes JPEG, PNG o WebP.",
        )

    results = await cosmos_service.query_items(
        cosmos_service.CONTAINER_COLLECTION,
        "SELECT * FROM c WHERE c.id = @id AND c.user_id = @user_id",
        parameters=[
            {"name": "@id", "value": entry_id},
            {"name": "@user_id", "value": current_user.user_id},
        ],
        partition_key=current_user.user_id,
    )
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tienes esta entrada en tu colección.",
        )

    cover_url = await blob_service.upload_user_cover(
        file_data=await file.read(),
        content_type=file.content_type,
        user_id=current_user.user_id,
    )

    entry = results[0]
    entry["cover_override_url"] = cover_url
    entry["updated_at"] = datetime.utcnow().isoformat()
    await cosmos_service.upsert_item(cosmos_service.CONTAINER_COLLECTION, entry)

    return {"cover_url": cover_url}
