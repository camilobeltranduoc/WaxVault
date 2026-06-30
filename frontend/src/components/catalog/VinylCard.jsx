/**
 * Tarjeta de vinilo para el grid del catálogo público.
 */

import { Link } from 'react-router-dom'
import { formatCurrency, formatYear, truncate } from '@utils/formatters'

export default function VinylCard({ vinyl }) {
  return (
    <Link
      to={`/catalog/${vinyl.id}`}
      className="block card hover:shadow-lg transition-shadow duration-200 group"
    >
      {/* Portada */}
      <div className="aspect-square w-full overflow-hidden rounded-lg mb-3 bg-vinyl-groove">
        <img
          src={vinyl.cover_image_url || '/placeholder-vinyl.svg'}
          alt={`${vinyl.artist} — ${vinyl.title}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = '/placeholder-vinyl.svg' }}
        />
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="font-semibold text-vinyl-black leading-tight">
          {truncate(vinyl.title, 40)}
        </p>
        <p className="text-sm text-gray-500">{truncate(vinyl.artist, 35)}</p>
        <p className="text-xs text-gray-400">
          {vinyl.label && `${vinyl.label} · `}
          {formatYear(vinyl.year)}
        </p>
        {vinyl.discogs_market_price != null ? (
          <p className="text-sm font-bold text-vinyl-label mt-2">
            {formatCurrency(vinyl.discogs_market_price)}
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-2">Ver precio →</p>
        )}
      </div>
    </Link>
  )
}
