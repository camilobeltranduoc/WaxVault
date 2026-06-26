"""
Router de Administración — Módulo C (Admin Backoffice).

Todos los endpoints requieren rol 'admin' (Depends(require_admin)).

Endpoints:
  Usuarios:
    GET    /api/admin/users              → Listar todos los usuarios
    GET    /api/admin/users/{id}         → Detalle de un usuario
    PATCH  /api/admin/users/{id}         → Actualizar rol o estado (bloquear/activar)
    DELETE /api/admin/users/{id}         → Eliminar usuario

  Catálogo maestro:
    POST   /api/admin/catalog            → Crear vinilo directamente (sin pasar por PENDING)
    PATCH  /api/admin/catalog/{id}       → Editar metadata de un vinilo
    DELETE /api/admin/catalog/{id}       → Archivar vinilo (soft delete)

  Flujo de aprobación:
    GET    /api/admin/approvals          → Bandeja de vinilos PENDING
    POST   /api/admin/approvals/{id}/approve  → Aprobar vinilo (PENDING → APPROVED)
    POST   /api/admin/approvals/{id}/reject   → Rechazar vinilo (PENDING → REJECTED)
"""

import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, status

from middleware.auth_middleware import CurrentUser, require_admin
from models.user import UserPublic, UserUpdate
from models.vinyl import Vinyl, VinylCreate, VinylPublic, VinylStatus, VinylUpdate
from services import cosmos_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

async def _find_vinyl_by_id(vinyl_id: str) -> Optional[dict]:
    """Busca un vinilo en cualquier partición (cross-partition query)."""
    results = await cosmos_service.query_items(
        cosmos_service.CONTAINER_VINYLS,
        "SELECT * FROM c WHERE c.id = @id",
        parameters=[{"name": "@id", "value": vinyl_id}],
    )
    return results[0] if results else None


async def _change_vinyl_status(vinyl: dict, new_status: VinylStatus) -> dict:
    """
    Cambia el status de un vinilo.
    En Cosmos DB la partition key es /status, así que al cambiarla hay que
    borrar el documento viejo e insertar uno nuevo con el status actualizado.
    """
    old_status = vinyl["status"]
    if old_status == new_status.value:
        return vinyl

    await cosmos_service.delete_item(
        cosmos_service.CONTAINER_VINYLS,
        vinyl["id"],
        partition_key=old_status,
    )

    vinyl["status"] = new_status.value
    vinyl["updated_at"] = datetime.utcnow().isoformat()
    return await cosmos_service.upsert_item(cosmos_service.CONTAINER_VINYLS, vinyl)


# ---------------------------------------------------------------------------
# Gestión de Usuarios
# ---------------------------------------------------------------------------

@router.get(
    "/users",
    summary="Listar usuarios",
    description="Retorna todos los usuarios registrados en la plataforma.",
)
async def list_users(admin: CurrentUser = Depends(require_admin)):
    users = await cosmos_service.query_items(
        cosmos_service.CONTAINER_USERS,
        "SELECT * FROM c ORDER BY c.created_at DESC",
    )
    public = []
    for u in users:
        try:
            public.append(UserPublic(**u).model_dump())
        except Exception:
            public.append(u)
    return {"users": public, "total": len(public)}


@router.get(
    "/users/{user_id}",
    summary="Detalle de usuario",
)
async def get_user(user_id: str, admin: CurrentUser = Depends(require_admin)):
    results = await cosmos_service.query_items(
        cosmos_service.CONTAINER_USERS,
        "SELECT * FROM c WHERE c.b2c_object_id = @uid OR c.id = @uid",
        parameters=[{"name": "@uid", "value": user_id}],
        partition_key=user_id,
    )
    if not results:
        results = await cosmos_service.query_items(
            cosmos_service.CONTAINER_USERS,
            "SELECT * FROM c WHERE c.b2c_object_id = @uid OR c.id = @uid",
            parameters=[{"name": "@uid", "value": user_id}],
        )
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario '{user_id}' no encontrado.",
        )
    return results[0]


@router.patch(
    "/users/{user_id}",
    summary="Actualizar usuario",
    description="Permite cambiar el rol, bloquear o desbloquear un usuario.",
)
async def update_user(
    user_id: str,
    update: UserUpdate,
    admin: CurrentUser = Depends(require_admin),
):
    results = await cosmos_service.query_items(
        cosmos_service.CONTAINER_USERS,
        "SELECT * FROM c WHERE c.b2c_object_id = @uid",
        parameters=[{"name": "@uid", "value": user_id}],
        partition_key=user_id,
    )
    if not results:
        results = await cosmos_service.query_items(
            cosmos_service.CONTAINER_USERS,
            "SELECT * FROM c WHERE c.b2c_object_id = @uid OR c.id = @uid",
            parameters=[{"name": "@uid", "value": user_id}],
        )
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario '{user_id}' no encontrado.",
        )

    existing = results[0]
    patch = update.model_dump(exclude_none=True)
    if "role" in patch:
        patch["role"] = patch["role"].value if hasattr(patch["role"], "value") else patch["role"]
    patch["updated_at"] = datetime.utcnow().isoformat()
    existing.update(patch)

    saved = await cosmos_service.upsert_item(cosmos_service.CONTAINER_USERS, existing)
    return saved


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar usuario",
)
async def delete_user(user_id: str, admin: CurrentUser = Depends(require_admin)):
    results = await cosmos_service.query_items(
        cosmos_service.CONTAINER_USERS,
        "SELECT * FROM c WHERE c.b2c_object_id = @uid OR c.id = @uid",
        parameters=[{"name": "@uid", "value": user_id}],
        partition_key=user_id,
    )
    if not results:
        results = await cosmos_service.query_items(
            cosmos_service.CONTAINER_USERS,
            "SELECT * FROM c WHERE c.b2c_object_id = @uid OR c.id = @uid",
            parameters=[{"name": "@uid", "value": user_id}],
        )
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario '{user_id}' no encontrado.",
        )

    user = results[0]
    await cosmos_service.delete_item(
        cosmos_service.CONTAINER_USERS,
        user["id"],
        partition_key=user.get("b2c_object_id", user["id"]),
    )
    return None


# ---------------------------------------------------------------------------
# Catálogo Maestro
# ---------------------------------------------------------------------------

@router.post(
    "/catalog",
    status_code=status.HTTP_201_CREATED,
    summary="Crear vinilo (admin)",
    description="El admin crea vinilos directamente en estado APPROVED, sin flujo de aprobación.",
)
async def create_vinyl(vinyl: VinylCreate, admin: CurrentUser = Depends(require_admin)):
    new_vinyl = Vinyl(
        id=str(uuid.uuid4()),
        status=VinylStatus.APPROVED,
        created_by_user_id=admin.user_id,
        **vinyl.model_dump(),
    )
    saved = await cosmos_service.upsert_item(
        cosmos_service.CONTAINER_VINYLS,
        new_vinyl.model_dump(),
    )
    return saved


@router.patch(
    "/catalog/{vinyl_id}",
    summary="Actualizar vinilo",
)
async def update_vinyl(
    vinyl_id: str,
    update: VinylUpdate,
    admin: CurrentUser = Depends(require_admin),
):
    vinyl = await _find_vinyl_by_id(vinyl_id)
    if not vinyl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vinilo '{vinyl_id}' no encontrado.",
        )

    patch = update.model_dump(exclude_none=True)
    new_status = patch.pop("status", None)

    patch["updated_at"] = datetime.utcnow().isoformat()
    vinyl.update(patch)

    if new_status and new_status != vinyl["status"]:
        vinyl["status"] = new_status.value if hasattr(new_status, "value") else new_status
        saved = await _change_vinyl_status(vinyl, VinylStatus(vinyl["status"]))
    else:
        saved = await cosmos_service.upsert_item(cosmos_service.CONTAINER_VINYLS, vinyl)

    return saved


@router.delete(
    "/catalog/{vinyl_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Archivar vinilo",
    description="Cambia el estado del vinilo a ARCHIVED (soft delete).",
)
async def archive_vinyl(vinyl_id: str, admin: CurrentUser = Depends(require_admin)):
    vinyl = await _find_vinyl_by_id(vinyl_id)
    if not vinyl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vinilo '{vinyl_id}' no encontrado.",
        )
    await _change_vinyl_status(vinyl, VinylStatus.ARCHIVED)
    return None


# ---------------------------------------------------------------------------
# Flujo de Aprobación
# ---------------------------------------------------------------------------

@router.get(
    "/approvals",
    summary="Bandeja de aprobación",
    description="Lista todos los vinilos en estado PENDING creados por usuarios.",
)
async def list_pending_vinyls(admin: CurrentUser = Depends(require_admin)):
    vinyls = await cosmos_service.query_items(
        cosmos_service.CONTAINER_VINYLS,
        "SELECT * FROM c WHERE c.status = @status ORDER BY c.created_at ASC",
        parameters=[{"name": "@status", "value": VinylStatus.PENDING.value}],
        partition_key=VinylStatus.PENDING.value,
    )
    public = [VinylPublic(**v).model_dump() for v in vinyls]
    return {"pending_vinyls": public, "total": len(public)}


@router.post(
    "/approvals/{vinyl_id}/approve",
    summary="Aprobar vinilo",
    description="Cambia el estado del vinilo de PENDING a APPROVED, publicándolo en el catálogo.",
)
async def approve_vinyl(vinyl_id: str, admin: CurrentUser = Depends(require_admin)):
    vinyl = await cosmos_service.query_items(
        cosmos_service.CONTAINER_VINYLS,
        "SELECT * FROM c WHERE c.id = @id AND c.status = @status",
        parameters=[
            {"name": "@id", "value": vinyl_id},
            {"name": "@status", "value": VinylStatus.PENDING.value},
        ],
        partition_key=VinylStatus.PENDING.value,
    )
    if not vinyl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vinilo PENDING '{vinyl_id}' no encontrado.",
        )

    saved = await _change_vinyl_status(vinyl[0], VinylStatus.APPROVED)
    return {"vinyl_id": vinyl_id, "status": "approved", "approved_by": admin.user_id, "vinyl": saved}


@router.post(
    "/approvals/{vinyl_id}/reject",
    summary="Rechazar vinilo",
    description="Cambia el estado del vinilo de PENDING a REJECTED.",
)
async def reject_vinyl(
    vinyl_id: str,
    reason: str = Body(default="No cumple con los criterios del catálogo", embed=True),
    admin: CurrentUser = Depends(require_admin),
):
    vinyl = await cosmos_service.query_items(
        cosmos_service.CONTAINER_VINYLS,
        "SELECT * FROM c WHERE c.id = @id AND c.status = @status",
        parameters=[
            {"name": "@id", "value": vinyl_id},
            {"name": "@status", "value": VinylStatus.PENDING.value},
        ],
        partition_key=VinylStatus.PENDING.value,
    )
    if not vinyl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vinilo PENDING '{vinyl_id}' no encontrado.",
        )

    doc = vinyl[0]
    doc["rejection_reason"] = reason
    saved = await _change_vinyl_status(doc, VinylStatus.REJECTED)
    return {"vinyl_id": vinyl_id, "status": "rejected", "reason": reason, "rejected_by": admin.user_id}
