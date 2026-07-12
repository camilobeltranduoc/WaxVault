"""
Modelos Pydantic para usuarios de WaxVault.

Los usuarios se crean automáticamente en Cosmos DB la primera vez que
se autentican con Azure AD B2C. El campo `b2c_object_id` (claim "oid"
del token JWT) es el identificador canónico del usuario en el sistema.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """Roles de usuario en la plataforma."""
    COLLECTOR = "collector"   # Usuario estándar — gestiona su propia colección
    ADMIN = "admin"           # Acceso completo al backoffice (Módulo C)


class User(BaseModel):
    """
    Documento de usuario en Cosmos DB.
    Partition key: /b2c_object_id (queries de usuario son siempre single-partition)
    """
    id: Optional[str] = Field(default=None)
    b2c_object_id: str = Field(
        ...,
        description="Claim 'oid' del JWT de Azure AD B2C. Identificador inmutable del usuario."
    )
    email: str = Field(..., description="Email del usuario (claim 'emails[0]' o 'email' en B2C)")
    display_name: Optional[str] = Field(default=None, max_length=100)
    role: UserRole = Field(default=UserRole.COLLECTOR)
    is_active: bool = Field(
        default=True,
        description="False = usuario bloqueado por el admin. No puede autenticarse."
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class UserCreate(BaseModel):
    """Payload para registrar un usuario (llamado internamente al primer login)."""
    b2c_object_id: str
    email: str
    display_name: Optional[str] = None


class UserUpdate(BaseModel):
    """Payload para actualizar un usuario desde el admin backoffice."""
    display_name: Optional[str] = Field(default=None, max_length=100)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserPublic(BaseModel):
    """Vista pública/admin de un usuario (sin campos sensibles de B2C)."""
    id: str
    b2c_object_id: Optional[str] = None
    email: str
    display_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
