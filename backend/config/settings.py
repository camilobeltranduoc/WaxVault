"""
Configuración centralizada de WaxVault Backend.

Usa Pydantic BaseSettings para leer variables de entorno y del archivo .env.
El decorator @lru_cache garantiza que la instancia se crea una sola vez por
worker process, lo que es crítico para el rendimiento de Azure Functions
(evita re-leer el .env en cada invocación caliente).

Uso en otros módulos:
    from config.settings import get_settings
    settings = get_settings()
    endpoint = settings.cosmos_db_endpoint
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Lee primero las variables de entorno del sistema (Azure Functions las inyecta),
        # luego el archivo .env para desarrollo local.
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignora variables no declaradas (ej. AzureWebJobsStorage)
    )

    # ------------------------------------------------------------------
    # Azure Cosmos DB
    # ------------------------------------------------------------------
    cosmos_db_endpoint: str = ""
    cosmos_db_key: str = ""
    cosmos_db_database: str = "waxvault"

    # ------------------------------------------------------------------
    # Azure Blob Storage
    # ------------------------------------------------------------------
    blob_storage_connection_string: str = ""
    blob_container_covers: str = "vinyl-covers"

    # ------------------------------------------------------------------
    # Azure AD B2C / Microsoft Entra External ID
    # ------------------------------------------------------------------
    b2c_tenant: str = ""
    b2c_client_id: str = ""
    b2c_policy: str = "B2C_1_signupsignin"
    # URI del endpoint JWKS para validar los tokens JWT emitidos por B2C
    b2c_jwks_uri: str = ""

    # ------------------------------------------------------------------
    # Discogs API
    # ------------------------------------------------------------------
    discogs_api_token: str = ""
    discogs_base_url: str = "https://api.discogs.com"

    # ------------------------------------------------------------------
    # Configuración de la aplicación
    # ------------------------------------------------------------------
    environment: str = "development"
    # Orígenes CORS permitidos (separados por coma en la variable de entorno)
    allowed_origins: str = "http://localhost:5173,http://localhost:4280"

    # ------------------------------------------------------------------
    # Propiedades computadas
    # ------------------------------------------------------------------
    @property
    def allowed_origins_list(self) -> list[str]:
        """Convierte el string CSV de orígenes en lista para CORSMiddleware."""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    """
    Singleton de configuración — usa @lru_cache para evitar múltiples lecturas
    del .env en invocaciones calientes de Azure Functions.
    """
    return Settings()
