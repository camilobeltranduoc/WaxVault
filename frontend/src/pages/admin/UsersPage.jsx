/**
 * Backoffice — Gestión de usuarios (Módulo C).
 */

import { useState } from 'react'
import { useAdminUsers } from '@hooks/useAdminUsers'
import { formatDate } from '@utils/formatters'
import LoadingSpinner from '@components/common/LoadingSpinner'

const ROLES = [
  { value: 'collector', label: 'Coleccionista' },
  { value: 'admin', label: 'Administrador' },
]

export default function UsersPage() {
  const { usersQuery, updateUser, deleteUser } = useAdminUsers()
  const { data, isLoading, isError } = usersQuery
  const [confirmDelete, setConfirmDelete] = useState(null)

  const users = data?.users || []

  if (isLoading) return <LoadingSpinner label="Cargando usuarios..." />

  if (isError) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-600">Error al cargar usuarios.</p>
      </div>
    )
  }

  const handleRoleChange = (userId, newRole) => {
    updateUser.mutate({ id: userId, role: newRole })
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-vinyl-black">Usuarios</h1>
        <span className="text-sm text-gray-500">{users.length} registrados</span>
      </div>

      {users.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-lg font-semibold text-vinyl-black">Sin usuarios registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-vinyl">
          <table className="w-full bg-white text-sm">
            <thead className="bg-vinyl-black text-vinyl-cream">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-center font-semibold">Rol</th>
                <th className="px-4 py-3 text-center font-semibold">Estado</th>
                <th className="px-4 py-3 text-center font-semibold">Registrado</th>
                <th className="px-4 py-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const userId = user.b2c_object_id || user.id
                return (
                  <tr key={user.id} className="hover:bg-vinyl-cream transition-colors">
                    <td className="px-4 py-3 font-medium">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600">{user.display_name || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(userId, e.target.value)}
                        disabled={updateUser.isPending}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-vinyl-label"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={updateUser.isPending}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {user.is_active ? 'Activo' : 'Bloqueado'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {confirmDelete === userId ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-gray-600">¿Confirmar?</span>
                          <button
                            onClick={() => handleDelete(userId)}
                            className="text-xs text-red-600 font-semibold hover:underline"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(userId)}
                          disabled={deleteUser.isPending}
                          className="text-xs text-red-600 hover:underline"
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
