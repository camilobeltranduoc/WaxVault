/**
 * Página para agregar un vinilo a la colección — Módulo B.
 * Flujo: buscar álbum en Discogs → ir al detalle → elegir prensado → agregar.
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@services/api'

export default function AddVinylPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const timerRef = useRef(null)

  const handleChange = (e) => {
    setSearchTerm(e.target.value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedTerm(e.target.value), 400)
  }

  const { data, isFetching } = useQuery({
    queryKey: ['add-vinyl-search', debouncedTerm],
    queryFn: async () => {
      const res = await api.get('/catalog', { params: { q: debouncedTerm, per_page: 12 } })
      return res.data
    },
    enabled: debouncedTerm.length >= 2,
  })

  const results = data?.items || []

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-vinyl-black mb-2">Agregar a Mi Colección</h1>
      <p className="text-sm text-gray-500 mb-6">
        Busca el álbum en Discogs. Luego podrás elegir el prensado exacto que tienes.
      </p>

      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder="Buscar artista, álbum..."
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-vinyl-label mb-4"
        autoFocus
      />

      {isFetching && (
        <p className="text-sm text-gray-400 mb-4">Buscando en Discogs...</p>
      )}

      {debouncedTerm.length >= 2 && !isFetching && results.length === 0 && (
        <div className="card text-center py-8 text-gray-400">
          Sin resultados para &quot;{debouncedTerm}&quot;
        </div>
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
          {results.map((vinyl) => (
            <li key={vinyl.id}>
              <button
                type="button"
                onClick={() => navigate(`/catalog/${vinyl.id}`)}
                className="w-full text-left px-4 py-3 hover:bg-vinyl-cream transition-colors flex items-center gap-4"
              >
                {vinyl.cover_image_url ? (
                  <img
                    src={vinyl.cover_image_url}
                    alt=""
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-vinyl-groove rounded-lg flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-vinyl-black truncate">{vinyl.title}</p>
                  <p className="text-sm text-gray-500 truncate">{vinyl.artist}</p>
                  {vinyl.year && <p className="text-xs text-gray-400">{vinyl.year}</p>}
                </div>
                <span className="text-xs text-vinyl-label font-medium flex-shrink-0">
                  Ver prensados →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {searchTerm.length < 2 && (
        <div className="card text-center py-12 mt-4">
          <p className="text-4xl mb-3">🎵</p>
          <p className="text-gray-500 text-sm">
            Empieza a escribir para buscar en la base de datos de Discogs
          </p>
        </div>
      )}
    </div>
  )
}
