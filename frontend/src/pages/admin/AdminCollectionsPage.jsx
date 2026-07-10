import { useState } from 'react'
import { useAdminCollections } from '@hooks/useAdminCollections'
import { formatDate } from '@utils/formatters'
import LoadingSpinner from '@components/common/LoadingSpinner'

const CONDITIONS = ['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']

function EditModal({ entry, onClose, onSave, isPending }) {
  const [form, setForm] = useState({
    condition: entry.condition ?? 'VG',
    purchase_price: entry.purchase_price ?? '',
    notes: entry.notes ?? '',
    is_for_sale: entry.is_for_sale ?? false,
    asking_price: entry.asking_price ?? '',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id: entry.id,
      condition: form.condition,
      purchase_price: form.purchase_price !== '' ? Number(form.purchase_price) : null,
      notes: form.notes || null,
      is_for_sale: form.is_for_sale,
      asking_price: form.asking_price !== '' ? Number(form.asking_price) : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-vinyl-black">Editar entrada</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <p className="text-sm text-gray-500 mb-1">
          <span className="font-medium text-vinyl-black">{entry.title}</span>{entry.artist && ` — ${entry.artist}`}
        </p>
        {(entry.user_email || entry.user_name) && (
          <p className="label-mono text-gray-400 mb-4">
            Usuario: {entry.user_name || entry.user_email}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vinyl-black mb-1">Condición</label>
            <select
              value={form.condition}
              onChange={(e) => set('condition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
            >
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-vinyl-black mb-1">Precio de compra (USD)</label>
            <input
              type="number" step="0.01" min="0" placeholder="0.00"
              value={form.purchase_price}
              onChange={(e) => set('purchase_price', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-vinyl-black mb-1">Notas</label>
            <textarea
              rows={2} placeholder="Observaciones..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox" id="is_for_sale"
              checked={form.is_for_sale}
              onChange={(e) => set('is_for_sale', e.target.checked)}
              className="w-4 h-4 accent-vinyl-label"
            />
            <label htmlFor="is_for_sale" className="text-sm text-vinyl-black">En venta</label>
          </div>

          {form.is_for_sale && (
            <div>
              <label className="block text-sm font-medium text-vinyl-black mb-1">Precio pedido (USD)</label>
              <input
                type="number" step="0.01" min="0" placeholder="0.00"
                value={form.asking_price}
                onChange={(e) => set('asking_price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const CONDITION_COLORS = {
  M: 'bg-violet-100 text-violet-800 border-violet-300',
  NM: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'VG+': 'bg-green-100 text-green-800 border-green-300',
  VG: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'G+': 'bg-orange-100 text-orange-800 border-orange-300',
  G: 'bg-red-100 text-red-800 border-red-300',
  F: 'bg-red-200 text-red-900 border-red-400',
  P: 'bg-gray-200 text-gray-700 border-gray-400',
}

export default function AdminCollectionsPage() {
  const { collectionsQuery, updateEntry, deleteEntry } = useAdminCollections()
  const { data, isLoading, isError } = collectionsQuery
  const [editingEntry, setEditingEntry] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')

  const entries = data?.entries || []

  const filtered = search.trim()
    ? entries.filter((e) => {
        const q = search.toLowerCase()
        return (
          e.title?.toLowerCase().includes(q) ||
          e.artist?.toLowerCase().includes(q) ||
          e.user_email?.toLowerCase().includes(q) ||
          e.user_name?.toLowerCase().includes(q)
        )
      })
    : entries

  const handleSave = async (payload) => {
    await updateEntry.mutateAsync(payload)
    setEditingEntry(null)
  }

  const handleDelete = (id) => {
    deleteEntry.mutate(id)
    setConfirmDelete(null)
  }

  if (isLoading) return <LoadingSpinner label="Cargando colecciones..." />

  if (isError) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-600">Error al cargar las colecciones.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="label-mono text-gray-400 mb-1">Módulo C</p>
          <h1 className="font-display text-5xl text-vinyl-black tracking-wide">COLECCIONES</h1>
        </div>
        <span className="label-mono bg-vinyl-label/20 text-vinyl-black border border-vinyl-label/30 px-3 py-1 rounded-full">
          {entries.length} entradas
        </span>
      </div>

      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, artista o usuario..."
          className="w-full max-w-md px-4 py-2 border-0 border-b-2 border-vinyl-groove/40 focus:border-vinyl-label bg-transparent text-sm focus:outline-none transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">Sin entradas{search ? ' para esa búsqueda' : ' en las colecciones'}.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-vinyl">
          <table className="w-full bg-white text-sm">
            <thead className="bg-vinyl-black text-vinyl-cream">
              <tr>
                <th className="px-4 py-3 text-left"><span className="label-mono">Vinilo</span></th>
                <th className="px-4 py-3 text-left"><span className="label-mono">Usuario</span></th>
                <th className="px-4 py-3 text-center"><span className="label-mono">Condición</span></th>
                <th className="px-4 py-3 text-right"><span className="label-mono">Precio compra</span></th>
                <th className="px-4 py-3 text-center"><span className="label-mono">Agregado</span></th>
                <th className="px-4 py-3 text-center"><span className="label-mono">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {entry.cover_image_url || entry.cover_override_url ? (
                        <img
                          src={entry.cover_override_url || entry.cover_image_url}
                          alt=""
                          className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-vinyl-groove/30 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <span className="text-vinyl-groove text-xs">LP</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-vinyl-black truncate max-w-[180px]">{entry.title}</p>
                        <p className="label-mono text-gray-500 truncate max-w-[180px]">{entry.artist}</p>
                        {!entry.discogs_id && (
                          <span className="label-mono text-[10px] bg-vinyl-cream border border-vinyl-groove/30 px-1.5 py-0.5 rounded">
                            manual
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-vinyl-black text-xs truncate max-w-[150px]">
                      {entry.user_name || '—'}
                    </p>
                    <p className="label-mono text-gray-400 truncate max-w-[150px]">
                      {entry.user_email || entry.user_id?.slice(0, 12) + '...'}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className={`label-mono px-2 py-0.5 rounded border ${CONDITION_COLORS[entry.condition] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                      {entry.condition || '—'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-sm">
                    {entry.purchase_price != null ? `$${entry.purchase_price.toFixed(2)}` : '—'}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="label-mono text-gray-400">{formatDate(entry.created_at)}</span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {confirmDelete === entry.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-gray-600">¿Confirmar?</span>
                        <button onClick={() => handleDelete(entry.id)} className="text-xs text-red-600 font-semibold hover:underline">
                          Sí
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:underline">
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="text-xs text-vinyl-label font-semibold hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(entry.id)}
                          disabled={deleteEntry.isPending}
                          className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingEntry && (
        <EditModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleSave}
          isPending={updateEntry.isPending}
        />
      )}
    </div>
  )
}
