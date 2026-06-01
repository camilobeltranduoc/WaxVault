# WaxVault

**Cloud-native vinyl record collection management platform.**

Plataforma para que coleccionistas de discos de vinilo cataloguen, gestionen y tasen su inventario físico en tiempo real.

---

## Arquitectura

| Capa | Tecnología | Servicio Azure |
|------|-----------|----------------|
| Frontend | React 18 + Vite + TailwindCSS | Azure Static Web Apps |
| Backend | Python FastAPI (Azure Functions v2) | Azure Functions (Consumption) |
| Base de datos | NoSQL documentos JSON | Azure Cosmos DB |
| Almacenamiento | Portadas de vinilos | Azure Blob Storage |
| Autenticación | Azure AD B2C (Entra External ID) | Microsoft Entra |
| API Externa | Metadata + precios de mercado | Discogs API |

---

## Módulos

| Módulo | Acceso | Funcionalidades |
|--------|--------|----------------|
| A — Público | Todos | Navegación catálogo, búsqueda, precio de mercado |
| B — Coleccionista | Usuario logueado | CRUD colección, subir portadas, dashboard patrimonial, exportar CSV/PDF |
| C — Admin Backoffice | Rol `admin` | CRUD usuarios, catálogo maestro, flujo aprobación vinilos |

---

## Prerequisitos

- Python 3.12+
- Node.js 20+ / npm 10+
- Azure CLI (`az`)
- Azure Functions Core Tools v4 (`func`) — ver paso 1 de setup

---

## Setup Local

### 1. Instalar Azure Functions Core Tools

```powershell
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Copiar y editar variables de entorno locales
Copy-Item local.settings.json.example local.settings.json
# Editar local.settings.json con tus credenciales de Azure

# Arrancar backend en modo desarrollo
func start
```

> API disponible en `http://localhost:7071/api`  
> Swagger UI en `http://localhost:7071/api/docs`

### 3. Frontend

```powershell
cd frontend
npm install

# Copiar y editar variables de entorno
Copy-Item .env.example .env.local
# Editar .env.local con tus credenciales de Azure AD B2C

npm run dev
```

> App disponible en `http://localhost:5173`

### 4. Git

```powershell
# Desde la raíz del monorepo
git init
git add .
git commit -m "chore: initial WaxVault monorepo scaffold"
```

---

## Estructura del Monorepo

```
WaxVault/
├── .github/workflows/     # CI/CD pipelines (GitHub Actions)
├── backend/               # FastAPI sobre Azure Functions v2 (Python)
│   ├── config/            # Configuración (Pydantic BaseSettings)
│   ├── middleware/        # Auth middleware (JWT / Azure AD B2C)
│   ├── models/            # Modelos Pydantic (Vinyl, User, Collection)
│   ├── routers/           # Endpoints FastAPI por módulo
│   └── services/          # Cosmos DB, Blob Storage, Discogs, Auth
├── frontend/              # React SPA (Vite + TailwindCSS)
│   └── src/
│       ├── auth/          # Configuración MSAL / B2C
│       ├── components/    # Componentes React reutilizables
│       ├── constants/     # Roles, QueryKeys
│       ├── context/       # AuthContext, CollectionContext
│       ├── hooks/         # Hooks custom (useAuth, useCollection, etc.)
│       ├── pages/         # Páginas por módulo + admin/
│       ├── services/      # Axios instance con interceptor JWT
│       └── utils/         # Formateadores y validadores (Zod)
├── infra/                 # Azure Bicep (IaC)
│   └── modules/           # CosmosDB, Storage, FunctionApp, SWA
└── README.md
```

---

## Despliegue en Azure

```bash
# Crear Resource Group
az group create --name waxvault-dev --location eastus

# Desplegar infraestructura
az deployment group create \
  --resource-group waxvault-dev \
  --template-file infra/main.bicep \
  --parameters environmentName=dev
```

---

## Variables de Entorno Requeridas

| Variable | Servicio | Dónde se usa |
|----------|---------|-------------|
| `COSMOS_DB_ENDPOINT` | Azure Cosmos DB | Backend |
| `COSMOS_DB_KEY` | Azure Cosmos DB | Backend |
| `BLOB_STORAGE_CONNECTION_STRING` | Azure Blob Storage | Backend |
| `B2C_TENANT` | Azure AD B2C | Backend + Frontend |
| `B2C_CLIENT_ID` | Azure AD B2C | Backend + Frontend |
| `DISCOGS_API_TOKEN` | Discogs API | Backend |

Ver `backend/.env.example` y `frontend/.env.example` para la lista completa.

---

## Licencia

MIT — Proyecto académico DUOC UC, Taller Aplicado de Software.
