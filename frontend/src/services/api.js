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
import { msalInstance, loginRequest } from '@auth/msalConfig'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,  // 15 segundos — Azure Functions puede tener cold start
})

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
    // Intento silencioso — usa el refresh_token si el access_token expiró
    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0],
    })
    config.headers.Authorization = `Bearer ${tokenResponse.accessToken}`
  } catch (error) {
    // El silencioso falló (sesión expirada, consent requerido, etc.)
    // Iniciar flujo interactivo por redirect
    console.warn('[API] Silent token acquisition failed, redirecting to login:', error)
    await msalInstance.acquireTokenRedirect(loginRequest)
  }

  return config
})

// ---------------------------------------------------------------------------
// Interceptor de RESPONSE — manejo global de errores
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado → forzar re-login
      console.error('[API] 401 Unauthorized — redirecting to login')
      await msalInstance.acquireTokenRedirect(loginRequest)
    }
    // Para otros errores (404, 422, 500), dejar que el caller los maneje
    return Promise.reject(error)
  },
)

export default api
