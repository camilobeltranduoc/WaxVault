/**
 * Detalle de un vinilo del catálogo — Módulo A.
 * TODO: Conectar con useVinylDetail y mostrar precio de mercado Discogs.
 */

import { useParams } from 'react-router-dom'
import { useVinylDetail } from '@hooks/useVinylSearch'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatCurrency, formatCondition, formatYear } from '@utils/formatters'

export default function VinylDetailPage() {
  const { vinylId } = useParams()
  const { data: vinyl, isLoading, isError } = useVinylDetail(vinylId)

  if (isLoading) return <LoadingSpinner label="Cargando vinilo..." />

  if (isError || !vinyl) {
    return (
      <div className="card text-center py-12">
        <p className="text-2xl mb-3">😕</p>
        <p className="text-lg font-semibold">Vinilo no encontrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Portada */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-vinyl-groove shadow-vinyl">
          <img
            src={vinyl.cover_image_url || '/placeholder-vinyl.svg'}
            alt={vinyl.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-vinyl-black">{vinyl.title}</h1>
            <p className="text-xl text-gray-600 mt-1">{vinyl.artist}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {vinyl.label && (
              <div>
                <span className="text-gray-400">Sello</span>
                <p className="font-medium">{vinyl.label}</p>
              </div>
            )}
            <div>
              <span className="text-gray-400">Año</span>
              <p className="font-medium">{formatYear(vinyl.year)}</p>
            </div>
            {vinyl.country && (
              <div>
                <span className="text-gray-400">País</span>
                <p className="font-medium">{vinyl.country}</p>
              </div>
            )}
            {vinyl.format && (
              <div>
                <span className="text-gray-400">Formato</span>
                <p className="font-medium">{vinyl.format}</p>
              </div>
            )}
          </div>

          {/* Precio de mercado */}
          <div className="card !bg-vinyl-black !text-vinyl-cream">
            <p className="text-sm text-gray-400">Precio de mercado (Discogs)</p>
            <p className="text-4xl font-bold text-vinyl-label mt-1">
              {formatCurrency(vinyl.discogs_market_price)}
            </p>
          </div>

          {/* Géneros */}
          {vinyl.genre?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {vinyl.genre.map((g) => (
                <span key={g} className="px-3 py-1 bg-vinyl-cream border border-vinyl-groove rounded-full text-xs font-medium">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
