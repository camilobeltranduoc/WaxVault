import { Link } from 'react-router-dom'
import { formatCurrency, formatYear, truncate } from '@utils/formatters'

export default function VinylCard({ vinyl }) {
  const genre = vinyl.genre?.[0]

  return (
    <Link
      to={`/catalog/${vinyl.id}`}
      className="block card !p-3 hover:shadow-vinyl-glow hover:-translate-y-1 transition-all duration-200 group"
    >
      {/* Portada */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl mb-3 bg-vinyl-groove">
        <img
          src={vinyl.cover_image_url || '/placeholder-vinyl.svg'}
          alt={`${vinyl.artist} — ${vinyl.title}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = '/placeholder-vinyl.svg' }}
        />
        {genre && (
          <span className="absolute top-2 right-2 label-mono bg-black/65 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            {truncate(genre, 12)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-0.5 px-1">
        <p className="font-semibold text-vinyl-black leading-tight text-sm">
          {truncate(vinyl.title, 40)}
        </p>
        <p className="label-mono text-gray-500">{truncate(vinyl.artist, 30)}</p>
        <p className="label-mono text-gray-400">
          {vinyl.label && `${vinyl.label} · `}
          {formatYear(vinyl.year)}
        </p>
        {vinyl.discogs_market_price != null ? (
          <p className="text-sm font-bold text-vinyl-label pt-1">
            {formatCurrency(vinyl.discogs_market_price)}
          </p>
        ) : (
          <p className="label-mono text-gray-400 pt-1 group-hover:text-vinyl-label transition-colors">
            Ver precio →
          </p>
        )}
      </div>
    </Link>
  )
}
