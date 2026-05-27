"""
Router de Colección Personal — Módulo B (Coleccionista autenticado).

Todos los endpoints requieren JWT válido (Depends(get_current_user)).

Endpoints:
  GET    /api/collection/           → Lista la colección del usuario autenticado
  POST   /api/collection/           → Agrega un vinilo a la colección
  PUT    /api/collection/{id}       → Actualiza una entrada (condición, precio, notas)
  DELETE /api/collection/{id}       → Elimina una entrada de la colección
  GET    /api/collection/dashboard  → Resumen patrimonial (valor total, ganancia, etc.)
  POST   /api/collection/add-vinyl  → Crea un vinilo nuevo (queda en estado PENDING)
  POST   /api/collection/{id}/cover → Sube portada personalizada a Azure Blob

TODO (próximos módulos):
  - Implementar queries reales a Cosmos DB (partition_key = user_id)
  - Integrar blob_service para subida de portadas
  - Calcular CollectionSummary con precios de Discogs
  - Implementar exportación CSV/PDF
"""

from fastapi import APIRouter, Depends, HTTPException, status

from middleware.auth_middleware import CurrentUser, get_current_user
from models.collection import CollectionEntryCreate, CollectionEntryUpdate

router = APIRouter()


@router.get(
    "/",
    summary="Listar mi colección",
    description="Retorna todos los vinilos en la colección del usuario autenticado.",
)
async def list_collection(current_user: CurrentUser = Depends(get_current_user)):
    """
    TODO: Query a Cosmos DB container 'collection':
        SELECT * FROM c WHERE c.user_id = @user_id
        Partition key = current_user.user_id → single-partition query
    """
    return {
        "items": [],
        "total": 0,
        "user_id": current_user.user_id,
    }


@router.get(
    "/dashboard",
    summary="Dashboard patrimonial",
    description="Retorna el resumen de valor total de la colección con datos para el gráfico histórico.",
)
async def get_dashboard(current_user: CurrentUser = Depends(get_current_user)):
    """
    TODO:
        1. Obtener todas las entradas de la colección del usuario
        2. Para cada vinilo, obtener discogs_market_price (o actualizar desde Discogs)
        3. Calcular: total_market_value, total_purchase_cost, unrealized_gain
        4. Retornar historial de tasación (para el gráfico de recharts)
    """
    return {
        "total_items": 0,
        "total_market_value": 0.0,
        "total_purchase_cost": 0.0,
        "unrealized_gain": 0.0,
        "condition_breakdown": {},
        "valuation_history": [],  # [{month: "2025-01", value: 1200}, ...]
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
    """
    TODO: Validar que vinyl_id existe en Cosmos (status = APPROVED),
          luego upsert en container 'collection' con user_id = current_user.user_id.
    """
    return {"message": "Vinilo agregado a la colección (stub)", "user_id": current_user.user_id}


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
    """
    TODO: Verificar que el entry_id pertenece al current_user.user_id antes de actualizar.
    """
    return {"message": "Entrada actualizada (stub)", "entry_id": entry_id}


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
    """
    TODO: Verificar ownership y llamar a cosmos_service.delete_item().
    """
    return None
