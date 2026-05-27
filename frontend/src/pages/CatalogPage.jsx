/**
 * Página de catálogo público — Módulo A.
 * TODO: Conectar con useVinylSearch y renderizar VinylCard.
 */

import { useState } from 'react'
import LoadingSpinner from '@components/common/LoadingSpinner'
import VinylCard from '@components/catalog/VinylCard'
import { useVinylSearch } from '@hooks/useVinylSearch'

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading, isError } = useVinylSearch(searchTerm)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-vinyl-black mb-4">🎵 Catálogo</h1>
        <input
          type="search"
          placeholder="Buscar por título, artista o label..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-xl px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-vinyl-label"
        />
      </div>

      {isLoading && <LoadingSpinner label="Cargando catálogo..." />}

      {isError && (
        <div className="card text-center py-8">
          <p className="text-red-600">Error al cargar el catálogo. Intenta nuevamente.</p>
        </div>
      )}

      {!isLoading && !isError && data?.items?.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-2xl mb-3">🔍</p>
          <p className="text-lg font-semibold">No se encontraron resultados</p>
          <p className="text-sm text-gray-500 mt-1">Intenta con otro término de búsqueda.</p>
        </div>
      )}

      {!isLoading && data?.items?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {data.items.map((vinyl) => (
            <VinylCard key={vinyl.id} vinyl={vinyl} />
          ))}
        </div>
      )}
    </div>
  )
}
