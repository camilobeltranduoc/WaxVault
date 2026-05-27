/**
 * Route guard para rutas del Módulo C (Admin Backoffice).
 *
 * - Si MSAL está procesando: muestra spinner.
 * - Si no está autenticado: redirige a "/".
 * - Si está autenticado pero no tiene rol 'admin': redirige a "/collection".
 * - Si tiene rol 'admin': renderiza la ruta hija via <Outlet />.
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { useAuth } from '@hooks/useAuth'
import { ROLES } from '@constants/roles'
import LoadingSpinner from './LoadingSpinner'

export default function AdminRoute() {
  const isAuthenticated = useIsAuthenticated()
  const { inProgress } = useMsal()
  const { userRole } = useAuth()

  if (inProgress !== 'none') {
    return <LoadingSpinner size="lg" label="Verificando permisos..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (userRole !== ROLES.ADMIN) {
    // Usuario autenticado pero sin rol admin → redirigir a su colección
    return <Navigate to="/collection" replace />
  }

  return <Outlet />
}
