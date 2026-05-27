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
    DELETE /api/admin/catalog/{id}       → Archivar vinilo

  Flujo de aprobación:
    GET    /api/admin/approvals          → Bandeja de vinilos PENDING
    POST   /api/admin/approvals/{id}/approve  → Aprobar vinilo (PENDING → APPROVED)
    POST   /api/admin/approvals/{id}/reject   → Rechazar vinilo (PENDING → REJECTED)

TODO: Implementar lógica real con Cosmos DB en todos los endpoints.
"""

from fastapi import APIRouter, Depends, status

from middleware.auth_middleware import CurrentUser, require_admin
from models.user import UserUpdate
from models.vinyl import VinylCreate, VinylUpdate

router = APIRouter()


# ---------------------------------------------------------------------------
# Gestión de Usuarios
# ---------------------------------------------------------------------------

@router.get(
    "/users",
    summary="Listar usuarios",
    description="Retorna todos los usuarios registrados en la plataforma.",
)
async def list_users(admin: CurrentUser = Depends(require_admin)):
    """TODO: Query a Cosmos DB container 'users' → SELECT * FROM c"""
    return {"users": [], "total": 0}


@router.get(
    "/users/{user_id}",
    summary="Detalle de usuario",
)
async def get_user(user_id: str, admin: CurrentUser = Depends(require_admin)):
    """TODO: cosmos_service.get_item(CONTAINER_USERS, user_id, partition_key=user_id)"""
    return {"user_id": user_id, "message": "Stub — implementación pendiente"}


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
    """TODO: Validar que no se puede quitar el rol admin al último admin."""
    return {"user_id": user_id, "updated": update.model_dump(exclude_none=True)}


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar usuario",
)
async def delete_user(user_id: str, admin: CurrentUser = Depends(require_admin)):
    """TODO: Eliminar de Cosmos DB y revocar sesiones en Azure AD B2C."""
    return None


# ---------------------------------------------------------------------------
# Catálogo Maestro
# ---------------------------------------------------------------------------

@router.post(
    "/catalog",
    status_code=status.HTTP_201_CREATED,
    summary="Crear vinilo (admin)",
    description="El admin puede crear vinilos directamente en estado APPROVED, sin pasar por el flujo de aprobación.",
)
async def create_vinyl(vinyl: VinylCreate, admin: CurrentUser = Depends(require_admin)):
    """TODO: Upsert en Cosmos DB con status=APPROVED."""
    return {"message": "Vinilo creado (stub)", "status": "approved"}


@router.patch(
    "/catalog/{vinyl_id}",
    summary="Actualizar vinilo",
)
async def update_vinyl(
    vinyl_id: str,
    update: VinylUpdate,
    admin: CurrentUser = Depends(require_admin),
):
    """TODO: Actualizar campos y updated_at en Cosmos DB."""
    return {"vinyl_id": vinyl_id, "updated": update.model_dump(exclude_none=True)}


@router.delete(
    "/catalog/{vinyl_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Archivar vinilo",
)
async def archive_vinyl(vinyl_id: str, admin: CurrentUser = Depends(require_admin)):
    """TODO: Cambiar status a ARCHIVED (soft delete — no elimina el documento)."""
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
    """
    TODO: Query a Cosmos DB:
        SELECT * FROM c WHERE c.status = 'pending' ORDER BY c.created_at ASC
    """
    return {"pending_vinyls": [], "total": 0}


@router.post(
    "/approvals/{vinyl_id}/approve",
    summary="Aprobar vinilo",
    description="Cambia el estado del vinilo de PENDING a APPROVED, publicándolo en el catálogo.",
)
async def approve_vinyl(vinyl_id: str, admin: CurrentUser = Depends(require_admin)):
    """TODO: Cambiar status a APPROVED y notificar al usuario creador."""
    return {"vinyl_id": vinyl_id, "status": "approved", "approved_by": admin.user_id}


@router.post(
    "/approvals/{vinyl_id}/reject",
    summary="Rechazar vinilo",
    description="Cambia el estado del vinilo de PENDING a REJECTED.",
)
async def reject_vinyl(
    vinyl_id: str,
    reason: str = "No cumple con los criterios del catálogo",
    admin: CurrentUser = Depends(require_admin),
):
    """TODO: Cambiar status a REJECTED, guardar razón, notificar al usuario."""
    return {
        "vinyl_id": vinyl_id,
        "status": "rejected",
        "reason": reason,
        "rejected_by": admin.user_id,
    }
