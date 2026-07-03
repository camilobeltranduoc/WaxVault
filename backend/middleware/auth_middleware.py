"""
Middleware de autenticación para FastAPI (WaxVault Backend).

Provee FastAPI dependencies que se usan como parámetros en los endpoints:
  - get_current_user: Valida el JWT y retorna un CurrentUser. Lanza 401 si inválido.
  - require_admin: Extiende get_current_user, requiere rol 'admin'. Lanza 403 si no tiene rol.

Uso en endpoints:
    @router.get("/mi-coleccion")
    async def mi_coleccion(current_user: CurrentUser = Depends(get_current_user)):
        return {"user_id": current_user.user_id}

    @router.get("/admin/usuarios")
    async def listar_usuarios(admin: CurrentUser = Depends(require_admin)):
        ...
"""

import uuid
from datetime import datetime

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from config.settings import get_settings
from services.auth_service import (
    extract_email,
    extract_roles,
    extract_user_id,
    validate_token,
)
from services import cosmos_service

# HTTPBearer extrae automáticamente el token del header "Authorization: Bearer <token>"
bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    """
    Representa al usuario autenticado en el contexto de una request.
    Construido a partir de los claims del JWT validado.
    """

    def __init__(
        self,
        user_id: str,
        email: str,
        roles: list[str],
        claims: dict,
    ) -> None:
        self.user_id = user_id    # b2c_object_id (claim 'oid')
        self.email = email
        self.roles = roles
        self.claims = claims      # Claims completos por si se necesita algo específico

    @property
    def is_admin(self) -> bool:
        """True si el usuario tiene el rol 'admin'."""
        return "admin" in self.roles

    @property
    def is_collector(self) -> bool:
        """True si es coleccionista o admin (admin tiene todos los permisos de collector)."""
        return "collector" in self.roles or self.is_admin

    def __repr__(self) -> str:
        return f"CurrentUser(user_id={self.user_id!r}, roles={self.roles})"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    x_dev_auth: str = Header(default=None, alias="X-Dev-Auth"),
) -> CurrentUser:
    """
    FastAPI dependency — valida el JWT de B2C y retorna el CurrentUser.

    En development, acepta el header X-Dev-Auth con formato "role:email:user_id"
    para evitar la dependencia de Azure AD B2C en pruebas locales.

    Raises:
        HTTPException(401): Si el token es inválido, expirado o no provisto.
    """
    settings = get_settings()

    # Bypass de desarrollo — solo cuando ENVIRONMENT=development
    if settings.environment == "development" and x_dev_auth:
        parts = x_dev_auth.split(":", 2)
        if len(parts) == 3:
            role, email, user_id = parts
            return CurrentUser(user_id=user_id, email=email, roles=[role], claims={})

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales. Token inválido o expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        raise credentials_exception

    try:
        claims = await validate_token(credentials.credentials)
        user_id = extract_user_id(claims)
        email = extract_email(claims)

        if not user_id:
            raise credentials_exception

        roles = await _provision_user(user_id, email, claims)

        return CurrentUser(user_id=user_id, email=email, roles=roles, claims=claims)

    except JWTError:
        raise credentials_exception


async def _provision_user(user_id: str, email: str, claims: dict) -> list[str]:
    """
    Upsert del usuario en Cosmos DB en cada login.
    Si es nuevo: crea con role=collector.
    Si ya existe: preserva el rol asignado por el admin.
    Retorna la lista de roles del usuario según Cosmos DB.
    """
    try:
        existing = await cosmos_service.query_items(
            cosmos_service.CONTAINER_USERS,
            "SELECT * FROM c WHERE c.b2c_object_id = @oid",
            parameters=[{"name": "@oid", "value": user_id}],
            partition_key=user_id,
        )

        if existing:
            user_doc = existing[0]
            user_doc["email"] = email
            user_doc["updated_at"] = datetime.utcnow().isoformat()
            await cosmos_service.upsert_item(cosmos_service.CONTAINER_USERS, user_doc)
            return [user_doc.get("role", "collector")]
        else:
            display_name = claims.get("name") or claims.get("given_name") or email.split("@")[0]
            new_user = {
                "id": str(uuid.uuid4()),
                "b2c_object_id": user_id,
                "email": email,
                "display_name": display_name,
                "role": "collector",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            await cosmos_service.upsert_item(cosmos_service.CONTAINER_USERS, new_user)
            return ["collector"]

    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("User provision failed for %s: %s", user_id, exc)
        return extract_roles(claims)


async def require_admin(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """
    FastAPI dependency — requiere rol 'admin'. Composición sobre get_current_user.

    Raises:
        HTTPException(403): Si el usuario autenticado no tiene rol admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador para esta operación.",
        )
    return current_user
