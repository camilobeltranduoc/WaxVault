import { Link } from 'react-router-dom'

const ADMIN_MENU = [
  {
    path: '/admin/users',
    icon: '👥',
    label: 'Usuarios',
    desc: 'Gestionar cuentas, roles y bloqueos',
    tile: 'tile-dark',
    iconBg: 'bg-vinyl-label/20',
    delay: 0,
  },
  {
    path: '/admin/catalog',
    icon: '📀',
    label: 'Catálogo',
    desc: 'CRUD del catálogo maestro de vinilos',
    tile: 'tile-amber',
    iconBg: 'bg-vinyl-black/15',
    delay: 100,
  },
  {
    path: '/admin/approvals',
    icon: '✅',
    label: 'Aprobaciones',
    desc: 'Revisar vinilos pendientes de usuarios',
    tile: 'tile-cream',
    iconBg: 'bg-vinyl-black/8',
    delay: 200,
  },
]

export default function AdminDashboardPage() {
  return (
    <div>
      <p className="label-mono text-gray-400 mb-1">Módulo C</p>
      <h1 className="font-display text-5xl text-vinyl-black mb-2 tracking-wide">ADMIN BACKOFFICE</h1>
      <p className="text-gray-500 mb-10">Panel de administración de WaxVault.</p>

      <div className="grid md:grid-cols-3 gap-5">
        {ADMIN_MENU.map(({ path, icon, label, desc, tile, iconBg, delay }) => (
          <Link
            key={path}
            to={path}
            className={`${tile} hover:opacity-90 hover:scale-[1.02] transition-all duration-200
                        animate-fade-in-up opacity-0-init`}
            style={{ animationDelay: `${delay}ms` }}
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${iconBg} text-2xl mb-5`}>
              {icon}
            </div>
            <h2 className="font-display text-2xl mb-1 tracking-wide">{label.toUpperCase()}</h2>
            <p className="text-sm opacity-70">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
