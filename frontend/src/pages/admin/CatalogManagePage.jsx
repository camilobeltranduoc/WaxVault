/**
 * CRUD del catálogo local — Módulo C.
 * Vinilos almacenados en Cosmos DB: creados por el admin o enviados
 * por usuarios (flujo de aprobación). No incluye resultados de Discogs.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAdminCatalog } from '@hooks/useAdminCatalog'
import { addVinylSchema } from '@utils/validators'
import { formatDate } from '@utils/formatters'
import LoadingSpinner from '@components/common/LoadingSpinner'

const STATUS_LABELS = {
  approved: { label: 'Aprobado', cls: 'bg-green-100 text-green-700' },
  pending: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: 'Rechazado', cls: 'bg-red-100 text-red-700' },
  archived: { label: 'Archivado', cls: 'bg-gray-100 text-gray-500' },
}

function VinylFormModal({ initial, onSave, onClose, isSaving }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addVinylSchema),
    defaultValues: initial || {},
  })

  const fields = [
    { name: 'title', label: 'Título *', placeholder: 'The Dark Side of the Moon' },
    { name: 'artist', label: 'Artista *', placeholder: 'Pink Floyd' },
    { name: 'label', label: 'Sello', placeholder: 'Harvest Records' },
    { name: 'country', label: 'País', placeholder: 'UK' },
    { name: 'format', label: 'Formato', placeholder: 'LP' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-vinyl-black">
            {initial ? 'Editar vinilo' : 'Nuevo vinilo'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-3">
          {fields.map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-vinyl-black mb-1">{label}</label>
              <input
                {...register(name)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
              />
              {errors[name] && <p className="text-red-500 text-xs mt-0.5">{errors[name].message}</p>}
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-vinyl-black mb-1">Año</label>
            <input
              {...register('year', { valueAsNumber: true })}
              type="number"
              placeholder="1973"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
            />
            {errors.year && <p className="text-red-500 text-xs mt-0.5">{errors.year.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSaving} className="btn-primary flex-1">
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CatalogManagePage() {
  const { catalogQuery, createVinyl, updateVinyl, archiveVinyl } = useAdminCatalog()
  const { data, isLoading, isError } = catalogQuery
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVinyl, setEditingVinyl] = useState(null)
  const [confirmArchive, setConfirmArchive] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const vinyls = (data?.items || []).filter(
    (v) => statusFilter === 'all' || v.status === statusFilter
  )

  if (isLoading) return <LoadingSpinner label="Cargando catálogo..." />

  if (isError) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-600">Error al cargar el catálogo.</p>
      </div>
    )
  }

  const handleCreate = (formData) => {
    const clean = Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v !== undefined && v !== '')
    )
    if (clean.year) clean.year = Number(clean.year)
    createVinyl.mutate(clean, { onSuccess: () => setShowCreateModal(false) })
  }

  const handleUpdate = (formData) => {
    const clean = Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v !== undefined && v !== '')
    )
    if (clean.year) clean.year = Number(clean.year)
    updateVinyl.mutate({ id: editingVinyl.id, ...clean }, { onSuccess: () => setEditingVinyl(null) })
  }

  const handleArchive = (id) => {
    archiveVinyl.mutate(id)
    setConfirmArchive(null)
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="label-mono text-gray-400 mb-1">Módulo C</p>
          <h1 className="font-display text-5xl text-vinyl-black tracking-wide">CATÁLOGO LOCAL</h1>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + Nuevo Vinilo
        </button>
      </div>
      <p className="text-gray-500 text-sm mb-4 -mt-2">
        Vinilos guardados en la base de datos de WaxVault — creados por administradores o enviados por usuarios.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'approved', 'pending', 'rejected', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
              statusFilter === s
                ? 'bg-vinyl-black text-vinyl-cream border-vinyl-black'
                : 'bg-white text-gray-600 border-gray-300 hover:border-vinyl-black'
            }`}
          >
            {s === 'all' ? 'Todos' : STATUS_LABELS[s]?.label}
          </button>
        ))}
      </div>

      {vinyls.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-lg font-semibold text-vinyl-black">Sin vinilos en esta categoría</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-vinyl">
          <table className="w-full bg-white text-sm">
            <thead className="bg-vinyl-black text-vinyl-cream">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Título</th>
                <th className="px-4 py-3 text-left font-semibold">Artista</th>
                <th className="px-4 py-3 text-center font-semibold">Año</th>
                <th className="px-4 py-3 text-center font-semibold">Estado</th>
                <th className="px-4 py-3 text-center font-semibold">Creado</th>
                <th className="px-4 py-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vinyls.map((vinyl) => {
                const statusInfo = STATUS_LABELS[vinyl.status] || { label: vinyl.status, cls: '' }
                return (
                  <tr key={vinyl.id} className="hover:bg-vinyl-cream transition-colors">
                    <td className="px-4 py-3 font-medium">{vinyl.title}</td>
                    <td className="px-4 py-3 text-gray-600">{vinyl.artist}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{vinyl.year || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {formatDate(vinyl.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {confirmArchive === vinyl.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-gray-600">¿Archivar?</span>
                          <button onClick={() => handleArchive(vinyl.id)} className="text-xs text-red-600 font-semibold hover:underline">Sí</button>
                          <button onClick={() => setConfirmArchive(null)} className="text-xs text-gray-500 hover:underline">No</button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => setEditingVinyl(vinyl)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Editar
                          </button>
                          {vinyl.status !== 'archived' && (
                            <button
                              onClick={() => setConfirmArchive(vinyl.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Archivar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <VinylFormModal
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
          isSaving={createVinyl.isPending}
        />
      )}

      {editingVinyl && (
        <VinylFormModal
          initial={editingVinyl}
          onSave={handleUpdate}
          onClose={() => setEditingVinyl(null)}
          isSaving={updateVinyl.isPending}
        />
      )}
    </div>
  )
}
