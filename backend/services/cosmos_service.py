"""
Servicio de acceso a Azure Cosmos DB (NoSQL API).

Usa azure.cosmos.aio (cliente async) para no bloquear el event loop de FastAPI.
El cliente se crea una sola vez como singleton global y se reutiliza entre
invocaciones calientes de Azure Functions (patrón recomendado por Microsoft).

Containers del database "waxvault":
  - vinyls      → partition key: /status
  - users       → partition key: /b2c_object_id
  - collection  → partition key: /user_id
"""

import logging
from typing import Any, Optional

from azure.cosmos.aio import CosmosClient
from azure.cosmos.exceptions import CosmosResourceNotFoundError

from config.settings import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singleton — se inicializa una vez por worker process
# ---------------------------------------------------------------------------
_client: Optional[CosmosClient] = None


def get_cosmos_client() -> CosmosClient:
    """Retorna el cliente Cosmos DB singleton."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = CosmosClient(
            url=settings.cosmos_db_endpoint,
            credential=settings.cosmos_db_key,
        )
        logger.info("Cosmos DB client initialized.")
    return _client


async def get_container(container_name: str):
    """Retorna un ContainerClient para el container especificado."""
    settings = get_settings()
    client = get_cosmos_client()
    database = client.get_database_client(settings.cosmos_db_database)
    return database.get_container_client(container_name)


# ---------------------------------------------------------------------------
# Nombres de containers como constantes
# ---------------------------------------------------------------------------
CONTAINER_VINYLS = "vinyls"
CONTAINER_USERS = "users"
CONTAINER_COLLECTION = "collection"


# ---------------------------------------------------------------------------
# Operaciones genéricas CRUD
# ---------------------------------------------------------------------------

async def upsert_item(container_name: str, item: dict[str, Any]) -> dict[str, Any]:
    """
    Inserta o actualiza un documento. Retorna el documento almacenado.
    Cosmos DB genera el 'id' automáticamente si no se provee.
    """
    container = await get_container(container_name)
    result = await container.upsert_item(body=item)
    return result


async def get_item(
    container_name: str,
    item_id: str,
    partition_key: str,
) -> Optional[dict[str, Any]]:
    """
    Lee un documento por id y partition key.
    Retorna None si no existe (evita lanzar excepción al caller).
    """
    try:
        container = await get_container(container_name)
        return await container.read_item(item=item_id, partition_key=partition_key)
    except CosmosResourceNotFoundError:
        logger.debug("Item not found: %s/%s", container_name, item_id)
        return None
    except Exception as exc:
        logger.error("Error reading item %s/%s: %s", container_name, item_id, exc)
        raise


async def query_items(
    container_name: str,
    query: str,
    parameters: Optional[list[dict]] = None,
    partition_key: Optional[str] = None,
) -> list[dict[str, Any]]:
    """
    Ejecuta una query SQL parametrizada sobre un container.

    Ejemplo:
        await query_items(
            CONTAINER_COLLECTION,
            "SELECT * FROM c WHERE c.user_id = @user_id",
            parameters=[{"name": "@user_id", "value": "abc123"}],
            partition_key="abc123",
        )
    """
    container = await get_container(container_name)
    kwargs: dict[str, Any] = {
        "query": query,
        "parameters": parameters or [],
    }
    if partition_key:
        kwargs["partition_key"] = partition_key

    items = container.query_items(**kwargs)
    return [item async for item in items]


async def delete_item(
    container_name: str,
    item_id: str,
    partition_key: str,
) -> None:
    """Elimina un documento por id y partition key."""
    try:
        container = await get_container(container_name)
        await container.delete_item(item=item_id, partition_key=partition_key)
    except CosmosResourceNotFoundError:
        logger.warning("Tried to delete non-existent item: %s/%s", container_name, item_id)
