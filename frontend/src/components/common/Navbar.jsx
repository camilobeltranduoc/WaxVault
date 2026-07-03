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
import { WaxVaultLogo } from '@components/common/Logo'

export default function Navbar() {
  const { isAuthenticated, currentUser, userRole, login, logout } = useAuth()

  return (
    <nav className="sticky top-0 z-50 bg-vinyl-black text-vinyl-cream shadow-vinyl border-b border-vinyl-groove/40">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <WaxVaultLogo />
          </Link>

          {/* Links principales */}
          <div className="flex items-center gap-7">
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                `label-mono transition-all hover:text-vinyl-label pb-0.5 ${
                  isActive ? 'text-vinyl-label' : 'text-vinyl-cream/70'
                }`
              }
              style={({ isActive }) =>
                isActive ? { boxShadow: '0 -2px 0 0 #c9a84c inset' } : {}
              }
            >
              Catálogo
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink
                  to="/collection"
                  className={({ isActive }) =>
                    `label-mono transition-all hover:text-vinyl-label pb-0.5 ${
                      isActive ? 'text-vinyl-label' : 'text-vinyl-cream/70'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive ? { boxShadow: '0 -2px 0 0 #c9a84c inset' } : {}
                  }
                >
                  Mi Colección
                </NavLink>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `label-mono transition-all hover:text-vinyl-label pb-0.5 ${
                      isActive ? 'text-vinyl-label' : 'text-vinyl-cream/70'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive ? { boxShadow: '0 -2px 0 0 #c9a84c inset' } : {}
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
                  `label-mono transition-all hover:text-vinyl-red pb-0.5 ${
                    isActive ? 'text-vinyl-red' : 'text-vinyl-cream/70'
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { boxShadow: '0 -2px 0 0 #c0392b inset' } : {}
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
                <span className="label-mono text-gray-500 hidden sm:block truncate max-w-[160px]">
                  {currentUser?.name || currentUser?.email}
                </span>
                <button
                  onClick={logout}
                  className="label-mono text-vinyl-cream/70 hover:text-vinyl-label transition-colors"
                >
                  Salir
                </button>
              </>
            ) : (
              <button
                onClick={login}
                className="btn-primary"
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
