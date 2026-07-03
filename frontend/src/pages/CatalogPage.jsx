import { useState } from 'react'
import VinylCard from '@components/catalog/VinylCard'
import SkeletonCard from '@components/catalog/SkeletonCard'
import { useVinylSearch, useVinylFeatured } from '@hooks/useVinylSearch'

const GENRES = [
  { label: 'Rock',       color: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' },
  { label: 'Jazz',       color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  { label: 'Electronic', color: 'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200' },
  { label: 'Hip-Hop',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' },
  { label: 'Soul',       color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' },
  { label: 'Classical',  color: 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200' },
  { label: 'Blues',      color: 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200' },
  { label: 'Reggae',     color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
  { label: 'Funk',       color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
  { label: 'Metal',      color: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' },
]

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading, isError } = useVinylSearch(searchTerm)
  const { data: featured, isLoading: featuredLoading } = useVinylFeatured()

  const showFeatured = searchTerm.length < 2

  return (
    <div>
      {/* Header + búsqueda */}
      <div className="mb-10">
        <p className="label-mono text-gray-400 mb-1">Módulo A — Público</p>
        <h1 className="font-display text-5xl text-vinyl-black mb-5 tracking-wide">CATÁLOGO</h1>
        <div className="relative max-w-xl">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="search"
            placeholder="Buscar por título, artista o label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-4 py-3 border-0 border-b-2 border-vinyl-groove/40
                       focus:border-vinyl-label focus:outline-none bg-transparent
                       text-vinyl-black placeholder:text-gray-400 transition-colors duration-200"
            autoFocus
          />
        </div>
      </div>

      {/* Géneros */}
      {showFeatured && (
        <div className="mb-10">
          <p className="label-mono text-gray-400 mb-3">Explorar por género</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(({ label, color }) => (
              <button
                key={label}
                onClick={() => setSearchTerm(label)}
                className={`border font-mono uppercase tracking-[0.1em] text-[11px] font-semibold
                            px-3 py-1 rounded-full transition-colors duration-150 ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured */}
      {showFeatured && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="label-mono text-gray-400">Destacados ahora</p>
            {featured?.genre && (
              <span className="label-mono bg-vinyl-label/20 text-vinyl-black px-2 py-0.5 rounded-full capitalize">
                {featured.genre}
              </span>
            )}
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {(featured?.items || []).map((vinyl) => (
                <VinylCard key={vinyl.id} vinyl={vinyl} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading búsqueda */}
      {!showFeatured && isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {!showFeatured && isError && (
        <div className="card text-center py-8 border-l-4 border-red-400">
          <p className="text-red-600">Error al conectar con Discogs. Intenta nuevamente.</p>
        </div>
      )}

      {/* Sin resultados */}
      {!showFeatured && !isLoading && !isError && data?.items?.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-2xl mb-3">😕</p>
          <p className="text-lg font-semibold">Sin resultados para &quot;{searchTerm}&quot;</p>
          <p className="text-sm text-gray-500 mt-1">Intenta con otro término de búsqueda.</p>
        </div>
      )}

      {/* Resultados */}
      {!showFeatured && !isLoading && data?.items?.length > 0 && (
        <>
          <p className="label-mono text-gray-400 mb-4">
            {data.total?.toLocaleString()} resultados · &quot;{searchTerm}&quot;
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {data.items.map((vinyl) => (
              <VinylCard key={vinyl.id} vinyl={vinyl} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
