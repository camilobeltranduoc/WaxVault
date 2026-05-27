/**
 * Route guard para rutas del Módulo B (Coleccionista).
 *
 * - Si MSAL está procesando (inProgress !== 'none'): muestra spinner.
 * - Si el usuario no está autenticado: redirige a "/".
 * - Si está autenticado: renderiza la ruta hija via <Outlet />.
 *
 * Uso en App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/collection" element={<CollectionPage />} />
 *   </Route>
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const { inProgress } = useMsal()

  // MSAL está procesando un redirect o silent token refresh
  if (inProgress !== 'none') {
    return <LoadingSpinner size="lg" label="Verificando autenticación..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
