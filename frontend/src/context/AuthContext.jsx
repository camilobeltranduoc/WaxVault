/**
 * Contexto de autenticación de WaxVault.
 *
 * Construye un objeto 'currentUser' a partir del estado de MSAL,
 * extrayendo el rol del campo 'extension_roles' de los id token claims.
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

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      const claims = accounts[0]?.idTokenClaims || {}
      // B2C almacena los roles en el atributo personalizado 'extension_roles'
      const rolesRaw = claims.extension_roles || ''
      const roles = rolesRaw.split(',').map((r) => r.trim()).filter(Boolean)
      setUserRole(roles.includes(ROLES.ADMIN) ? ROLES.ADMIN : ROLES.COLLECTOR)
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
