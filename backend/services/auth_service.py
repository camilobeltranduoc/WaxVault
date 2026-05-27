"""
Servicio de validación de tokens JWT emitidos por Azure AD B2C.

Flujo de validación:
  1. El frontend obtiene un access_token de Azure AD B2C (vía MSAL).
  2. El frontend envía el token en el header: Authorization: Bearer <token>
  3. Este servicio valida el token contra el JWKS endpoint de B2C.
  4. Si es válido, extrae los claims (oid, email, roles).

El JWKS (JSON Web Key Set) contiene las claves públicas RSA del tenant B2C.
Se cachea en memoria para evitar una request HTTP en cada invocación.

Endpoint JWKS pattern:
  https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}/discovery/v2.0/keys
"""

import logging
from typing import Optional

import httpx
from jose import JWTError, jwt

from config.settings import get_settings

logger = logging.getLogger(__name__)

# Cache en memoria del JWKS (se resetea solo cuando el worker se recicla)
_jwks_cache: Optional[dict] = None


async def _get_jwks() -> dict:
    """
    Obtiene el JWKS del endpoint de Azure AD B2C.
    Usa cache en memoria para evitar una HTTP request por cada validación.
    """
    global _jwks_cache
    if _jwks_cache is None:
        settings = get_settings()
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.b2c_jwks_uri, timeout=10.0)
            response.raise_for_status()
            _jwks_cache = response.json()
        logger.info("JWKS fetched and cached from B2C.")
    return _jwks_cache


async def validate_token(token: str) -> dict:
    """
    Valida un JWT de Azure AD B2C y retorna los claims decodificados.

    Args:
        token: JWT access_token (sin el prefijo "Bearer ").

    Returns:
        Diccionario con los claims del token (oid, email, extension_roles, etc.)

    Raises:
        JWTError: Si el token es inválido, expirado o la firma no coincide.
    """
    settings = get_settings()
    jwks = await _get_jwks()

    # Leer el kid del header sin validar para encontrar la clave correcta
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise JWTError(f"Token header inválido: {exc}") from exc

    kid = unverified_header.get("kid")

    # Buscar la clave pública RSA que corresponde al kid del token
    rsa_key: dict = {}
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
            break

    if not rsa_key:
        raise JWTError(f"No se encontró clave JWKS para kid={kid}")

    # Validar y decodificar el token
    payload = jwt.decode(
        token,
        rsa_key,
        algorithms=["RS256"],
        audience=settings.b2c_client_id,
        options={"verify_exp": True},
    )
    return payload


def extract_user_id(claims: dict) -> str:
    """
    Extrae el identificador único del usuario desde los claims.
    Azure AD B2C usa el claim 'oid' (Object ID) como identificador inmutable.
    """
    return claims.get("oid") or claims.get("sub", "")


def extract_email(claims: dict) -> str:
    """
    Extrae el email del usuario desde los claims.
    B2C puede emitir el email en 'email' o en el array 'emails'.
    """
    if "email" in claims:
        return claims["email"]
    emails = claims.get("emails", [])
    if isinstance(emails, list) and emails:
        return emails[0]
    return ""


def extract_roles(claims: dict) -> list[str]:
    """
    Extrae los roles del usuario desde los claims.
    Los roles se almacenan como atributo personalizado de B2C: 'extension_roles'
    (CSV string, ej. "admin" o "collector").
    """
    raw_roles = claims.get("extension_roles", "")
    if not raw_roles:
        return []
    return [r.strip() for r in raw_roles.split(",") if r.strip()]
