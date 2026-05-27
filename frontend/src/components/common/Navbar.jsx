/**
 * Barra de navegación principal de WaxVault.
 *
 * Muestra links distintos según el estado de autenticación y rol:
 *   - Siempre:         Logo, Catálogo
 *   - Autenticado:     Mi Colección, Dashboard
 *   - Admin:           + Backoffice
 *   - No autenticado:  Botón "Iniciar Sesión"
 *   - Autenticado:     Avatar / nombre + botón "Cerrar Sesión"
 */

import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { ROLES } from '@constants/roles'

export default function Navbar() {
  const { isAuthenticated, currentUser, userRole, login, logout } = useAuth()

  return (
    <nav className="bg-vinyl-black text-vinyl-cream shadow-vinyl">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-vinyl-label hover:opacity-90 transition-opacity"
          >
            🎵 WaxVault
          </Link>

          {/* Links principales */}
          <div className="flex items-center gap-6">
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-vinyl-label ${
                  isActive ? 'text-vinyl-label' : 'text-vinyl-cream'
                }`
              }
            >
              Catálogo
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink
                  to="/collection"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-vinyl-label ${
                      isActive ? 'text-vinyl-label' : 'text-vinyl-cream'
                    }`
                  }
                >
                  Mi Colección
                </NavLink>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-vinyl-label ${
                      isActive ? 'text-vinyl-label' : 'text-vinyl-cream'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
              </>
            )}

            {userRole === ROLES.ADMIN && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-vinyl-red ${
                    isActive ? 'text-vinyl-red' : 'text-vinyl-cream'
                  }`
                }
              >
                ⚙ Backoffice
              </NavLink>
            )}
          </div>

          {/* Auth actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-400 hidden sm:block">
                  {currentUser?.name || currentUser?.email}
                </span>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-vinyl-cream hover:text-vinyl-label transition-colors"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                onClick={login}
                className="btn-primary text-sm"
              >
                Iniciar sesión
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
