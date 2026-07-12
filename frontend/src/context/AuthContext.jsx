/**
 * Contexto de autenticación de WaxVault.
 *
 * Construye un objeto 'currentUser' a partir del estado de MSAL.
 *
 * El rol se resuelve en dos pasos:
 *   1. Inmediato: claim 'extension_roles' del id token de B2C (puede estar
 *      desactualizado — el backoffice cambia roles en Cosmos, no en B2C).
 *   2. Definitivo: GET /api/me retorna el rol vigente según Cosmos DB
 *      (la fuente de verdad que usa el backend para autorizar).
 *
 * ⚠️ Este contexto DEBE estar dentro de MsalProvider (definido en main.jsx).
 *
 * Uso:
 *   import { useAuthContext } from '@context/AuthContext'
 *   const { currentUser, isAuthenticated, userRole } = useAuthContext()
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { ROLES } from '@constants/roles'
import api from '@services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      // Paso 1 — rol provisional desde el claim del token (respuesta instantánea)
      const claims = accounts[0]?.idTokenClaims || {}
      const rolesRaw = claims.extension_roles || ''
      const roles = rolesRaw.split(',').map((r) => r.trim()).filter(Boolean)
      setUserRole(roles.includes(ROLES.ADMIN) ? ROLES.ADMIN : ROLES.COLLECTOR)

      // Paso 2 — rol real desde Cosmos vía backend (pisa al provisional)
      let cancelled = false
      api.get('/me/')
        .then((res) => {
          if (!cancelled && res.data?.role) {
            setUserRole(res.data.role === 'admin' ? ROLES.ADMIN : ROLES.COLLECTOR)
          }
        })
        .catch(() => {
          // Si /me falla (backend caído, token inválido), se mantiene el rol del claim
        })
      return () => { cancelled = true }
    } else {
      setUserRole(null)
    }
  }, [isAuthenticated, accounts])

  /** Usuario actual. null si no está autenticado. */
  const currentUser =
    isAuthenticated && accounts.length > 0
      ? {
          id: accounts[0].localAccountId,          // B2C object ID
          email: accounts[0].username,             // UPN / email
          name: accounts[0].name,
          role: userRole,
        }
      : null

  const value = {
    isAuthenticated,
    currentUser,
    userRole,
    isAdmin: userRole === ROLES.ADMIN,
    isCollector: userRole === ROLES.COLLECTOR || userRole === ROLES.ADMIN,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
