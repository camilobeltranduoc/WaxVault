"""
Router de Colección Personal — Módulo B (Coleccionista autenticado).

Todos los endpoints requieren JWT válido (Depends(get_current_user)).

Endpoints:
  GET    /api/collection/           → Lista la colección del usuario autenticado
  GET    /api/collection/dashboard  → Resumen patrimonial (valor total, ganancia, etc.)
  POST   /api/collection/           → Agrega un vinilo existente a la colección
  PUT    /api/collection/{id}       → Actualiza una entrada (condición, precio, notas)
  DELETE /api/collection/{id}       → Elimina una entrada de la colección
  POST   /api/collection/add-vinyl  → Crea un vinilo nuevo (queda en estado PENDING)
  POST   /api/collection/{id}/cover → Sube portada personalizada a Azure Blob
"""

import logging
import uuid
from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from middleware.auth_middleware import CurrentUser, get_current_user
from models.collection import CollectionEntry, CollectionEntryCreate, CollectionEntryUpdate
from models.vinyl import Vinyl, VinylCreate, VinylStatus
from services import blob_service, cosmos_service, discogs_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/dashboard",
    summary="Dashboard patrimonial",
    description="Resumen de valor total de la colección con historial de tasación para el gráfico.",
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

    vinyl_ids = list({e["vinyl_id"] for e in entries})
    vinyls_by_id: dict = {}
    for vid in vinyl_ids:
        results = await cosmos_service.query_items(
            cosmos_service.CONTAINER_VINYLS,
            "SELECT * FROM c WHERE c.id = @id",
            parameters=[{"name": "@id", "value": vid}],
        )
        if results:
            vinyls_by_id[vid] = results[0]

    for vid, vinyl in vinyls_by_id.items():
        if vinyl.get("discogs_id") and not vinyl.get("discogs_market_price"):
            try:
                stats = await discogs_service.get_marketplace_stats(vinyl["discogs_id"])
                if stats:
                    vinyl["discogs_market_price"] = discogs_service.extract_market_price(stats)
            except Exception as exc:
                logger.warning("Discogs stats error for vinyl %s: %s", vid, exc)

    total_market_value = 0.0
    total_purchase_cost = 0.0
    condition_breakdown: dict[str, int] = defaultdict(int)

    for entry in entries:
        vinyl = vinyls_by_id.get(entry["vinyl_id"], {})
        market_price = vinyl.get("discogs_market_price") or 0.0
        total_market_value += market_price
        total_purchase_cost += entry.get("purchase_price") or 0.0
        condition_breakdown[entry.get("condition", "VG")] += 1

    monthly_accumulator: dict[str, float] = defaultdict(float)
    running_value = 0.0
    for entry in entries:
        vinyl = vinyls_by_id.get(entry["vinyl_id"], {})
        market_price = vinyl.get("discogs_market_price") or (entry.get("purchase_price") or 0.0)
        running_value += market_price
        month_key = entry["created_at"][:7] if isinstance(entry["created_at"], str) else entry["created_at"].strftime("%Y-%m")
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

    enriched = []
    for entry in entries:
        vinyl_results = await cosmos_service.query_items(
            cosmos_service.CONTAINER_VINYLS,
            "SELECT c.id, c.title, c.artist, c.label, c.year, c.cover_image_url, c.discogs_market_price FROM c WHERE c.id = @id",
            parameters=[{"name": "@id", "value": entry["vinyl_id"]}],
        )
        vinyl_info = vinyl_results[0] if vinyl_results else {}
        enriched.append({**entry, "vinyl": vinyl_info})

    return {
        "items": enriched,
        "total": len(enriched),
        "user_id": current_user.user_id,
    }


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Agregar a mi colección",
    description="Agrega un vinilo existente del catálogo maestro a la colección personal.",
)
async def add_to_collection(
    entry: CollectionEntryCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    vinyl_results = await cosmos_service.query_items(
        cosmos_service.CONTAINER_VINYLS,
        "SELECT * FROM c WHERE c.id = @id AND c.status = @status",
        parameters=[
            {"name": "@id", "value": entry.vinyl_id},
            {"name": "@status", "value": VinylStatus.APPROVED.value},
        ],
        partition_key=VinylStatus.APPROVED.value,
    )
    if not vinyl_results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vinilo '{entry.vinyl_id}' no encontrado en el catálogo aprobado.",
        )

    new_entry = CollectionEntry(
        id=str(uuid.uuid4()),
        user_id=current_user.user_id,
        vinyl_id=entry.vinyl_id,
        condition=entry.condition,
        purchase_price=entry.purchase_price,
        purchase_date=entry.purchase_date,
        notes=entry.notes,
    )

    saved = await cosmos_service.upsert_item(
        cosmos_service.CONTAINER_COLLECTION,
        new_entry.model_dump(),
    )
    return saved


@router.put(
    "/{entry_id}",
    summary="Actualizar entrada de colección",
    description="Actualiza la condición, precio de compra, notas u otros campos de una entrada.",
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
    description="Elimina permanentemente una entrada de la colección del usuario.",
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
    "/add-vinyl",
    status_code=status.HTTP_201_CREATED,
    summary="Crear vinilo desde cero",
    description="El usuario crea un vinilo nuevo que queda en estado PENDING hasta aprobación del admin.",
)
async def create_vinyl_from_scratch(
    vinyl_data: VinylCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    new_vinyl = Vinyl(
        id=str(uuid.uuid4()),
        status=VinylStatus.PENDING,
        created_by_user_id=current_user.user_id,
        **vinyl_data.model_dump(),
    )

    saved = await cosmos_service.upsert_item(
        cosmos_service.CONTAINER_VINYLS,
        new_vinyl.model_dump(),
    )
    return saved


@router.post(
    "/{vinyl_id}/cover",
    summary="Subir portada personalizada",
    description="Sube una imagen de portada personalizada para un vinilo de la colección.",
)
async def upload_vinyl_cover(
    vinyl_id: str,
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
        "SELECT * FROM c WHERE c.vinyl_id = @vinyl_id AND c.user_id = @user_id",
        parameters=[
            {"name": "@vinyl_id", "value": vinyl_id},
            {"name": "@user_id", "value": current_user.user_id},
        ],
        partition_key=current_user.user_id,
    )
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tienes este vinilo en tu colección.",
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
