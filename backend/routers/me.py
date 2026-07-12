"""
Router de identidad del usuario autenticado.

GET /api/me → Retorna el perfil y rol REAL del usuario según Cosmos DB.

El rol en Cosmos es la fuente de verdad (el admin lo cambia desde el
backoffice). El claim 'extension_roles' del JWT de B2C puede quedar
desactualizado porque el backoffice no escribe en B2C — por eso el
frontend consulta este endpoint en vez de confiar solo en el token.
"""

from fastapi import APIRouter, Depends

from middleware.auth_middleware import CurrentUser, get_current_user

router = APIRouter()


@router.get("", include_in_schema=False)
@router.get(
    "/",
    summary="Perfil del usuario autenticado",
    description="Retorna user_id, email y rol vigente según Cosmos DB.",
)
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "roles": current_user.roles,
        "role": "admin" if current_user.is_admin else "collector",
    }
