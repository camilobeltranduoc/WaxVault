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
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// ---------------------------------------------------------------------------
// Render — pre-inicializar MSAL antes de montar React.
// Esto es obligatorio para MSAL Browser v3: evita que MsalProvider quede
// atascado en inProgress='startup' si initialize() falla silenciosamente.
// Con la instancia ya inicializada, MsalProvider solo llama handleRedirectPromise()
// y el estado pasa de 'startup' a 'none' en milisegundos.
// ---------------------------------------------------------------------------
async function bootstrap() {
  try {
    await msalInstance.initialize()
  } catch {
    // Si B2C no está disponible al cargar, continuar igual para que
    // el usuario vea la UI (el catálogo público no requiere auth)
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        </QueryClientProvider>
      </MsalProvider>
    </React.StrictMode>,
  )
}

bootstrap()
