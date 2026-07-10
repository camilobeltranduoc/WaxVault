/**
 * Componente raíz de enrutamiento de WaxVault.
 *
 * Estructura de rutas por módulo:
 *
 * Módulo A — Público (sin autenticación):
 *   /                    → HomePage
 *   /catalog             → CatalogPage (listado de vinilos aprobados)
 *   /catalog/:vinylId    → VinylDetailPage (detalle + precio de mercado)
 *
 * Módulo B — Coleccionista (requiere autenticación via ProtectedRoute):
 *   /collection          → CollectionPage (mi colección personal)
 *   /collection/add      → AddVinylPage (crear vinilo nuevo → PENDING)
 *   /dashboard           → DashboardPage (valor patrimonial + gráfico)
 *
 * Módulo C — Admin Backoffice (requiere rol 'admin' via AdminRoute):
 *   /admin               → AdminDashboardPage
 *   /admin/users         → UsersPage (CRUD usuarios)
 *   /admin/catalog       → CatalogManagePage (CRUD catálogo maestro)
 *   /admin/approvals     → ApprovalsPage (flujo de aprobación)
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

// Layout
import Navbar from '@components/common/Navbar'
import ProtectedRoute from '@components/common/ProtectedRoute'
import AdminRoute from '@components/common/AdminRoute'

// Módulo A — Público
import HomePage from '@pages/HomePage'
import CatalogPage from '@pages/CatalogPage'
import VinylDetailPage from '@pages/VinylDetailPage'

// Módulo B — Coleccionista
import CollectionPage from '@pages/CollectionPage'
import AddVinylPage from '@pages/AddVinylPage'
import DashboardPage from '@pages/DashboardPage'

// Módulo C — Admin
import AdminDashboardPage from '@pages/admin/AdminDashboardPage'
import UsersPage from '@pages/admin/UsersPage'
import CatalogManagePage from '@pages/admin/CatalogManagePage'
import ApprovalsPage from '@pages/admin/ApprovalsPage'
import AdminCollectionsPage from '@pages/admin/AdminCollectionsPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-vinyl-cream overflow-x-hidden">
        <Navbar />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <Routes>
            {/* ---------------------------------------------------------- */}
            {/* Módulo A — Público                                          */}
            {/* ---------------------------------------------------------- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/:vinylId" element={<VinylDetailPage />} />

            {/* ---------------------------------------------------------- */}
            {/* Módulo B — Coleccionista (autenticado)                      */}
            {/* ProtectedRoute redirige a "/" si no está autenticado        */}
            {/* ---------------------------------------------------------- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/collection/add" element={<AddVinylPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* ---------------------------------------------------------- */}
            {/* Módulo C — Admin Backoffice                                 */}
            {/* AdminRoute redirige a "/collection" si no tiene rol admin   */}
            {/* ---------------------------------------------------------- */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/catalog" element={<CatalogManagePage />} />
              <Route path="/admin/approvals" element={<ApprovalsPage />} />
              <Route path="/admin/collections" element={<AdminCollectionsPage />} />
            </Route>

            {/* Fallback — cualquier ruta no definida vuelve al inicio */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
