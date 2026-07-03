import { useState } from 'react'
import { useAdminUsers } from '@hooks/useAdminUsers'
import { formatDate } from '@utils/formatters'
import LoadingSpinner from '@components/common/LoadingSpinner'

const ROLES = [
  { value: 'collector', label: 'Coleccionista' },
  { value: 'admin', label: 'Administrador' },
]

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-teal-500', 'bg-amber-500',
  'bg-rose-500', 'bg-violet-500', 'bg-emerald-500',
]

function avatarColor(str = '') {
  const hash = [...str].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="label-mono inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
        ⚙ Admin
      </span>
    )
  }
  return (
    <span className="label-mono inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded-full">
      🎵 Collector
    </span>
  )
}

export default function UsersPage() {
  const { usersQuery, updateUser, deleteUser } = useAdminUsers()
  const { data, isLoading, isError } = usersQuery
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editingRole, setEditingRole] = useState(null)

  const users = data?.users || []

  if (isLoading) return <LoadingSpinner label="Cargando usuarios..." />

  if (isError) {
    return (
      <div className="card text-center py-8 border-l-4 border-red-400">
        <p className="text-red-600">Error al cargar usuarios.</p>
      </div>
    )
  }

  const handleRoleChange = (userId, newRole) => {
    updateUser.mutate({ id: userId, role: newRole })
    setEditingRole(null)
  }

  const handleToggleActive = (user) => {
    const uid = user.b2c_object_id || user.id
    updateUser.mutate({ id: uid, is_active: !user.is_active })
  }

  const handleDelete = (userId) => {
    deleteUser.mutate(userId)
    setConfirmDelete(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="label-mono text-gray-400 mb-1">Módulo C</p>
          <h1 className="font-display text-5xl text-vinyl-black tracking-wide">USUARIOS</h1>
        </div>
        <span className="label-mono bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
          {users.length} registrados
        </span>
      </div>

      {users.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-lg font-semibold text-vinyl-black">Sin usuarios registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-vinyl">
          <table className="w-full bg-white text-sm">
            <thead className="bg-vinyl-black text-vinyl-cream">
              <tr>
                <th className="px-4 py-3 text-left"><span className="label-mono">Usuario</span></th>
                <th className="px-4 py-3 text-center"><span className="label-mono">Rol</span></th>
                <th className="px-4 py-3 text-center"><span className="label-mono">Estado</span></th>
                <th className="px-4 py-3 text-center"><span className="label-mono">Vinilos</span></th>
                <th className="px-4 py-3 text-center"><span className="label-mono">Registrado</span></th>
                <th className="px-4 py-3 text-center"><span className="label-mono">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const userId = user.b2c_object_id || user.id
                const initials = (user.display_name || user.email || '?')[0].toUpperCase()
                const isEditing = editingRole === userId

                return (
                  <tr key={user.id} className="hover:bg-amber-50/30 border-l-4 border-transparent hover:border-vinyl-label transition-all duration-150">
                    {/* Avatar + email + nombre */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(user.email || user.id)}`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-vinyl-black truncate max-w-[200px]">
                            {user.display_name || '—'}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <select
                          defaultValue={user.role}
                          onChange={(e) => handleRoleChange(userId, e.target.value)}
                          onBlur={() => setEditingRole(null)}
                          autoFocus
                          disabled={updateUser.isPending}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-vinyl-label"
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      ) : (
                        <button onClick={() => setEditingRole(userId)} className="hover:opacity-80 transition-opacity">
                          <RoleBadge role={user.role} />
                        </button>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={updateUser.isPending}
                        className={`label-mono px-2 py-0.5 rounded-full border transition-colors ${
                          user.is_active
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
                        }`}
                      >
                        {user.is_active ? 'Activo' : 'Bloqueado'}
                      </button>
                    </td>

                    {/* Vinilos */}
                    <td className="px-4 py-3 text-center">
                      <span className="label-mono text-vinyl-black">
                        {user.vinyl_count ?? 0}
                      </span>
                    </td>

                    {/* Registrado */}
                    <td className="px-4 py-3 text-center">
                      <span className="label-mono text-gray-400">{formatDate(user.created_at)}</span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-center">
                      {confirmDelete === userId ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-gray-600">¿Confirmar?</span>
                          <button onClick={() => handleDelete(userId)} className="text-xs text-red-600 font-semibold hover:underline">
                            Sí
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:underline">
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(userId)}
                          disabled={deleteUser.isPending}
                          className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
