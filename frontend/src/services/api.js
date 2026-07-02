/**
 * Instancia de axios configurada para WaxVault.
 *
 * Interceptores:
 *   Request:  Adjunta el JWT access_token de Azure AD B2C a cada request
 *             via el header "Authorization: Bearer <token>".
 *             Si el token expiró, MSAL intenta renovarlo silenciosamente.
 *             Si la renovación falla, redirige al login de B2C.
 *
 *   Response: Si el backend retorna 401, fuerza un login interactivo.
 *             Otros errores se dejan propagar al caller.
 */

import axios from 'axios'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalInstance, loginRequest } from '@auth/msalConfig'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,  // 20 segundos — Azure Functions puede tener cold start
})

// Guard para evitar loops de redirect si múltiples requests fallan a la vez
let isRedirecting = false

// ---------------------------------------------------------------------------
// Interceptor de REQUEST — adjunta el Bearer token
// ---------------------------------------------------------------------------
api.interceptors.request.use(async (config) => {
  const accounts = msalInstance.getAllAccounts()

  // Si el usuario no está autenticado, enviar la request sin token
  // (los endpoints públicos del catálogo no requieren auth)
  if (accounts.length === 0) {
    return config
  }

  try {
    // Timeout de 8 segundos para evitar que acquireTokenSilent cuelgue la UI
    const tokenResponse = await Promise.race([
      msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MSAL timeout')), 8000)
      ),
    ])
    config.headers.Authorization = `Bearer ${tokenResponse.accessToken}`
  } catch (error) {
    // Si el token falla (cache miss, consent requerido, timeout), continuar sin token.
    // Los endpoints públicos (catálogo) responden 200 sin auth.
    // Los endpoints protegidos (colección) responden 401, que la respuesta intercepta abajo.
    console.warn('[API] Token acquisition failed, continuing without token:', error.message)
  }

  return config
})

// ---------------------------------------------------------------------------
// Interceptor de RESPONSE — manejo global de errores
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      console.error('[API] 401 Unauthorized — redirecting to login')
      isRedirecting = true
      msalInstance.acquireTokenRedirect(loginRequest)
    }
    // Para otros errores (404, 422, 500), dejar que el caller los maneje
    return Promise.reject(error)
  },
)

export default api
