/**
 * Punto de entrada de la aplicación React de WaxVault.
 *
 * Orden de providers (el más externo controla el contexto de los internos):
 *   MsalProvider         → Habilita hooks useIsAuthenticated, useMsal, etc.
 *   QueryClientProvider  → Habilita useQuery, useMutation de TanStack Query
 *   AuthProvider         → Contexto custom: currentUser, userRole (basado en MSAL)
 *   App                  → BrowserRouter con toda la lógica de rutas
 *
 * ⚠️ MsalProvider DEBE ser el más externo para que AuthProvider pueda usar
 *    los hooks de MSAL internamente.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { msalInstance } from '@auth/msalConfig'
import { AuthProvider } from '@context/AuthContext'
import App from './App'
import './index.css'

// ---------------------------------------------------------------------------
// Configuración de TanStack Query
// ---------------------------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 min → no refetch si los datos son recientes
      retry: 1,                      // 1 reintento en caso de error de red
      refetchOnWindowFocus: false,   // No refetch al cambiar de pestaña (UX menos agresiva)
    },
    mutations: {
      retry: 0,                      // No reintentar mutations automáticamente
    },
  },
})

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
        {/* DevTools solo se incluye en desarrollo (Vite lo tree-shakes en prod) */}
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
    </MsalProvider>
  </React.StrictMode>,
)
