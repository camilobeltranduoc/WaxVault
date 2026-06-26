/**
 * Bandeja de aprobación de vinilos — Módulo C.
 */

import { useState } from 'react'
import { useApprovals } from '@hooks/useApprovals'
import { formatDate } from '@utils/formatters'
import LoadingSpinner from '@components/common/LoadingSpinner'

function RejectModal({ vinyl, onConfirm, onClose, isPending }) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-vinyl-black mb-2">Rechazar vinilo</h2>
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-medium">{vinyl.title}</span> — {vinyl.artist}
        </p>
        <label className="block text-sm font-medium text-vinyl-black mb-1">
          Motivo del rechazo
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="No cumple con los criterios del catálogo..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onConfirm(reason || 'No cumple con los criterios del catálogo')}
            disabled={isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? 'Rechazando...' : 'Rechazar'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const { approvalsQuery, approveVinyl, rejectVinyl } = useApprovals()
  const { data, isLoading, isError } = approvalsQuery
  const [rejectingVinyl, setRejectingVinyl] = useState(null)

  const pending = data?.pending_vinyls || []

  if (isLoading) return <LoadingSpinner label="Cargando bandeja de aprobación..." />

  if (isError) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-600">Error al cargar la bandeja.</p>
      </div>
    )
  }

  const handleApprove = (id) => {
    approveVinyl.mutate(id)
  }

  const handleRejectConfirm = (reason) => {
    rejectVinyl.mutate({ id: rejectingVinyl.id, reason })
    setRejectingVinyl(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-vinyl-black">Bandeja de Aprobación</h1>
        <span className="text-sm font-semibold bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
          {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Vinilos creados por usuarios que están esperando revisión.
      </p>

      {pending.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-2xl mb-3">✅</p>
          <p className="text-lg font-semibold text-vinyl-black">Sin vinilos pendientes</p>
          <p className="text-sm text-gray-500 mt-2">
            Cuando los usuarios creen vinilos, aparecerán aquí para aprobación.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((vinyl) => (
            <div
              key={vinyl.id}
              className="card flex flex-col sm:flex-row gap-4 items-start sm:items-center"
            >
              {vinyl.cover_image_url && (
                <img
                  src={vinyl.cover_image_url}
                  alt={vinyl.title}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-vinyl-black text-lg truncate">{vinyl.title}</h3>
                <p className="text-gray-600 text-sm">{vinyl.artist}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {vinyl.label && <span className="text-xs text-gray-400">{vinyl.label}</span>}
                  {vinyl.year && <span className="text-xs text-gray-400">{vinyl.year}</span>}
                  {vinyl.format && <span className="text-xs text-gray-400">{vinyl.format}</span>}
                  {vinyl.country && <span className="text-xs text-gray-400">{vinyl.country}</span>}
                </div>
                {vinyl.genre?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {vinyl.genre.map((g) => (
                      <span key={g} className="text-xs bg-vinyl-cream text-vinyl-black px-2 py-0.5 rounded">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Enviado: {formatDate(vinyl.created_at)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(vinyl.id)}
                  disabled={approveVinyl.isPending || rejectVinyl.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => setRejectingVinyl(vinyl)}
                  disabled={approveVinyl.isPending || rejectVinyl.isPending}
                  className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectingVinyl && (
        <RejectModal
          vinyl={rejectingVinyl}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectingVinyl(null)}
          isPending={rejectVinyl.isPending}
        />
      )}
    </div>
  )
}
