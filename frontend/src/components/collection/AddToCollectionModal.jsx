/**
 * Modal para agregar un prensado específico a la colección personal.
 * Recibe el master (álbum) y el release (prensado concreto que el usuario eligió).
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCollection } from '@hooks/useCollection'

const CONDITIONS = ['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']

const schema = z.object({
  condition: z.enum(['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']),
  purchase_price: z.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export default function AddToCollectionModal({ master, release, onClose, onSuccess }) {
  const { addEntry } = useCollection()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { condition: 'VG', purchase_price: null, notes: '' },
  })

  const onSubmit = async (data) => {
    await addEntry.mutateAsync({
      discogs_id: release.id,
      condition: data.condition,
      purchase_price: data.purchase_price || null,
      notes: data.notes || null,
    })
    onSuccess?.()
    onClose()
  }

  if (!master || !release) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-vinyl-black">Agregar a Mi Colección</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Info del álbum + prensado seleccionado */}
        <div className="mb-5 p-3 bg-vinyl-cream rounded-xl space-y-2">
          <div className="flex gap-3 items-center">
            {(release.thumb || master.cover_image_url) && (
              <img
                src={release.thumb || master.cover_image_url}
                alt={master.title}
                className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-vinyl-black truncate">{master.title}</p>
              <p className="text-sm text-gray-500 truncate">{master.artist}</p>
            </div>
          </div>

          {/* Detalles del prensado */}
          <div className="text-xs text-gray-500 border-t border-gray-200 pt-2 grid grid-cols-2 gap-1">
            {release.year && <span><strong>Año:</strong> {release.year}</span>}
            {release.country && <span><strong>País:</strong> {release.country}</span>}
            {release.label && <span><strong>Sello:</strong> {release.label}</span>}
            {release.format && <span className="col-span-2"><strong>Formato:</strong> {release.format}</span>}
            {release.catno && <span className="col-span-2 font-mono"><strong>Cat#:</strong> {release.catno}</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vinyl-black mb-1">
              Condición de tu copia
            </label>
            <select
              {...register('condition')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinyl-label text-sm"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.condition && (
              <p className="text-red-500 text-xs mt-1">{errors.condition.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-vinyl-black mb-1">
              Precio de compra (USD) — opcional
            </label>
            <input
              {...register('purchase_price', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinyl-label text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-vinyl-black mb-1">
              Notas — opcional
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Ej: primera edición, vinilo en perfecto estado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinyl-label text-sm resize-none"
            />
          </div>

          {addEntry.isError && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-red-600 text-xs">Error al agregar. Intenta de nuevo.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || addEntry.isPending}
              className="btn-primary flex-1"
            >
              {addEntry.isPending ? 'Guardando...' : '+ Agregar a Mi Colección'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
