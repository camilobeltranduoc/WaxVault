/**
 * Hook de autenticación de WaxVault.
 *
 * Wrapper sobre MSAL + AuthContext que expone una API simple para
 * los componentes que necesitan login/logout o datos del usuario actual.
 *
 * Uso:
 *   const { isAuthenticated, currentUser, login, logout } = useAuth()
 */

import { useMsal } from '@azure/msal-react'
import { useAuthContext } from '@context/AuthContext'
import { loginRequest } from '@auth/msalConfig'

export function useAuth() {
  const { instance } = useMsal()
  const { isAuthenticated, currentUser, userRole, isAdmin, isCollector } = useAuthContext()

  /**
   * Inicia el flujo de login por redirect a Azure AD B2C.
   * El usuario será redirigido al portal B2C y luego de vuelta a la app.
   */
  const login = () => {
    instance.loginRedirect(loginRequest).catch((err) => {
      console.error('[useAuth] Login failed:', err)
    })
  }

  /**
   * Cierra la sesión del usuario y lo redirige a la homepage.
   */
  const logout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: '/',
    }).catch((err) => {
      console.error('[useAuth] Logout failed:', err)
    })
  }

  return {
    isAuthenticated,
    currentUser,
    userRole,
    isAdmin,
    isCollector,
    login,
    logout,
  }
}
