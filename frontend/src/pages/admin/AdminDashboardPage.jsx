/**
 * Dashboard del Admin Backoffice — Módulo C.
 * TODO: Conectar con stats reales de Cosmos DB.
 */

import { Link } from 'react-router-dom'

const ADMIN_MENU = [
  { path: '/admin/users', icon: '👥', label: 'Usuarios', desc: 'Gestionar cuentas, roles y bloqueos' },
  { path: '/admin/catalog', icon: '📀', label: 'Catálogo', desc: 'CRUD del catálogo maestro de vinilos' },
  { path: '/admin/approvals', icon: '✅', label: 'Aprobaciones', desc: 'Revisar vinilos pendientes de usuarios' },
]

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-vinyl-black mb-2">⚙ Admin Backoffice</h1>
      <p className="text-gray-500 mb-8">Panel de administración de WaxVault.</p>

      <div className="grid md:grid-cols-3 gap-6">
        {ADMIN_MENU.map(({ path, icon, label, desc }) => (
          <Link
            key={path}
            to={path}
            className="card hover:shadow-lg transition-shadow border-2 border-transparent hover:border-vinyl-label"
          >
            <div className="text-4xl mb-3">{icon}</div>
            <h2 className="text-lg font-bold text-vinyl-black mb-1">{label}</h2>
            <p className="text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
