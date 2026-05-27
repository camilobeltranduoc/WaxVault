"""
WaxVault — Azure Functions v2 Entry Point
=========================================
Este archivo es el único entry point de la Azure Function.
Usa el modelo de programación v2 de Python que permite integrar
FastAPI como una ASGI app mediante func.AsgiFunctionApp.

Flujo de una request:
  Azure Functions HTTP Trigger → AsgiFunctionApp wrapper → FastAPI router → Handler
"""

import azure.functions as func
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings
from routers import health, catalog, collection, admin

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
fastapi_app = FastAPI(
    title="WaxVault API",
    version="1.0.0",
    description=(
        "API cloud-native para la plataforma WaxVault. "
        "Gestión de colecciones de discos de vinilo con tasación en tiempo real."
    ),
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS — en producción, reemplazar con los dominios reales de Static Web App
# ---------------------------------------------------------------------------
settings = get_settings()
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
fastapi_app.include_router(
    health.router,
    prefix="/api/health",
    tags=["health"],
)
fastapi_app.include_router(
    catalog.router,
    prefix="/api/catalog",
    tags=["catalog"],
)
fastapi_app.include_router(
    collection.router,
    prefix="/api/collection",
    tags=["collection"],
)
fastapi_app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["admin"],
)

# ---------------------------------------------------------------------------
# Azure Functions v2 — ASGI wrapper
# http_auth_level=ANONYMOUS porque la autenticación la maneja el middleware JWT
# de FastAPI, no las function keys de Azure.
# ---------------------------------------------------------------------------
app = func.AsgiFunctionApp(
    app=fastapi_app,
    http_auth_level=func.AuthLevel.ANONYMOUS,
)
