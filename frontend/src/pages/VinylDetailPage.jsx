/**
 * Detalle de un álbum (master release) — Módulo A.
 * Muestra info del álbum y la lista de prensados disponibles en Discogs.
 * El usuario elige su versión exacta para agregar a la colección.
 */

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { useVinylDetail } from '@hooks/useVinylSearch'
import AddToCollectionModal from '@components/collection/AddToCollectionModal'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatYear } from '@utils/formatters'

export default function VinylDetailPage() {
  const { vinylId } = useParams()
  const { accounts } = useMsal()
  const isLoggedIn = accounts.length > 0

  const { data: master, isLoading, isError } = useVinylDetail(vinylId)
  const [selectedRelease, setSelectedRelease] = useState(null)

  if (isLoading) return <LoadingSpinner label="Cargando álbum..." />

  if (isError || !master) {
    return (
      <div className="card text-center py-12">
        <p className="text-2xl mb-3">😕</p>
        <p className="text-lg font-semibold">Álbum no encontrado</p>
      </div>
    )
  }

  const handleAddVersion = (version) => {
    setSelectedRelease(version)
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header del álbum */}
      <div className="grid md:grid-cols-[240px_1fr] gap-8 mb-10">
        <div className="aspect-square rounded-2xl overflow-hidden bg-vinyl-groove shadow-vinyl flex-shrink-0">
          <img
            src={master.cover_image_url || '/placeholder-vinyl.svg'}
            alt={master.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = '/placeholder-vinyl.svg' }}
          />
        </div>

        <div className="space-y-3">
          <div>
            <h1 className="font-display text-4xl text-vinyl-black tracking-wide">{master.title.toUpperCase()}</h1>
            <p className="label-mono text-gray-500 mt-2">{master.artist}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {master.year && (
              <div>
                <span className="label-mono text-gray-400 block mb-0.5">Año original</span>
                <span className="font-semibold">{formatYear(master.year)}</span>
              </div>
            )}
            {master.total_versions != null && (
              <div>
                <span className="label-mono text-gray-400 block mb-0.5">Prensados en vinilo</span>
                <span className="font-semibold">{master.versions?.length ?? master.total_versions}</span>
              </div>
            )}
          </div>

          {master.genre?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {master.genre.map((g) => (
                <span
                  key={g}
                  className="label-mono px-3 py-1 bg-vinyl-cream border border-vinyl-groove/50 rounded-full"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {!isLoggedIn && (
            <p className="text-sm text-gray-400 pt-2">
              Inicia sesión para agregar un prensado a tu colección
            </p>
          )}
        </div>
      </div>

      {/* Lista de versiones/prensados */}
      <div>
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="font-display text-3xl text-vinyl-black tracking-wide">PRENSADOS DISPONIBLES</h2>
          {master.versions?.length > 0 && (
            <span className="label-mono text-gray-400">
              {master.versions.length} en vinilo
            </span>
          )}
        </div>

        {!master.versions?.length && (
          <div className="card text-center py-8 text-gray-400">
            No se encontraron prensados en vinilo para este álbum.
          </div>
        )}

        {master.versions?.length > 0 && (
          <div className="overflow-x-auto rounded-2xl shadow-vinyl">
            <table className="w-full bg-white text-sm">
              <thead className="bg-vinyl-black text-vinyl-cream">
                <tr>
                  <th className="px-4 py-3 text-left"><span className="label-mono">Año</span></th>
                  <th className="px-4 py-3 text-left"><span className="label-mono">País</span></th>
                  <th className="px-4 py-3 text-left"><span className="label-mono">Sello</span></th>
                  <th className="px-4 py-3 text-left"><span className="label-mono">Formato</span></th>
                  <th className="px-4 py-3 text-left"><span className="label-mono">Cat#</span></th>
                  {isLoggedIn && (
                    <th className="px-4 py-3 text-center"><span className="label-mono">Acción</span></th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {master.versions.map((version) => (
                  <tr
                    key={version.id}
                    className="hover:bg-vinyl-cream transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-700">{version.year || '—'}</td>
                    <td className="px-4 py-3 font-medium">{version.country || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{version.label || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{version.format || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                      {version.catno || '—'}
                    </td>
                    {isLoggedIn && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleAddVersion(version)}
                          className="text-xs font-semibold text-vinyl-label hover:underline whitespace-nowrap"
                        >
                          + Agregar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal agregar versión seleccionada */}
      {selectedRelease && (
        <AddToCollectionModal
          master={master}
          release={selectedRelease}
          onClose={() => setSelectedRelease(null)}
          onSuccess={() => setSelectedRelease(null)}
        />
      )}
    </div>
  )
}
