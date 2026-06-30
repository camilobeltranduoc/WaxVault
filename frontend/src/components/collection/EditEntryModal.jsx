/**
 * Modal para editar una entrada de la colección personal.
 * Campos: condición, precio de compra, notas, en_venta, precio_pedido.
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCollection } from '@hooks/useCollection'

const CONDITIONS = ['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']

const editEntrySchema = z.object({
  condition: z.enum(['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']),
  purchase_price: z.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  is_for_sale: z.boolean().optional(),
  asking_price: z.number().min(0).optional().nullable(),
})

export default function EditEntryModal({ entry, onClose }) {
  const { updateEntry } = useCollection()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editEntrySchema),
    defaultValues: {
      condition: entry?.condition ?? 'VG',
      purchase_price: entry?.purchase_price ?? null,
      notes: entry?.notes ?? '',
      is_for_sale: entry?.is_for_sale ?? false,
      asking_price: entry?.asking_price ?? null,
    },
  })

  useEffect(() => {
    if (entry) {
      reset({
        condition: entry.condition ?? 'VG',
        purchase_price: entry.purchase_price ?? null,
        notes: entry.notes ?? '',
        is_for_sale: entry.is_for_sale ?? false,
        asking_price: entry.asking_price ?? null,
      })
    }
  }, [entry, reset])

  const isForSale = watch('is_for_sale')

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      purchase_price: data.purchase_price || null,
      asking_price: data.asking_price || null,
      notes: data.notes || null,
    }
    await updateEntry.mutateAsync({ id: entry.id, ...payload })
    onClose()
  }

  if (!entry) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-vinyl-black">Editar entrada</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-vinyl-black">{entry.title || 'Vinilo'}</span>
          {entry.artist && <span> — {entry.artist}</span>}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vinyl-black mb-1">Condición</label>
            <select
              {...register('condition')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinyl-label text-sm"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.condition && <p className="text-red-500 text-xs mt-1">{errors.condition.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-vinyl-black mb-1">Precio de compra (USD)</label>
            <input
              {...register('purchase_price', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinyl-label text-sm"
            />
            {errors.purchase_price && <p className="text-red-500 text-xs mt-1">{errors.purchase_price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-vinyl-black mb-1">Notas</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Observaciones sobre este ejemplar..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinyl-label text-sm resize-none"
            />
            {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register('is_for_sale')}
              type="checkbox"
              id="is_for_sale"
              className="w-4 h-4 accent-vinyl-label"
            />
            <label htmlFor="is_for_sale" className="text-sm text-vinyl-black">En venta</label>
          </div>

          {isForSale && (
            <div>
              <label className="block text-sm font-medium text-vinyl-black mb-1">Precio pedido (USD)</label>
              <input
                {...register('asking_price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinyl-label text-sm"
              />
              {errors.asking_price && <p className="text-red-500 text-xs mt-1">{errors.asking_price.message}</p>}
            </div>
          )}

          {updateEntry.isError && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-red-600 text-xs">Error al guardar. Intenta de nuevo.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting || updateEntry.isPending} className="btn-primary flex-1">
              {updateEntry.isPending ? 'Guardando...' : 'Guardar cambios'}
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
