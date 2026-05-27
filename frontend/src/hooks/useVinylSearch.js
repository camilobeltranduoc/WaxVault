/**
 * Hook de búsqueda en el catálogo público de vinilos.
 *
 * Características:
 *   - Solo ejecuta la query si hay 3+ caracteres (evita búsquedas vacías)
 *   - Cache de 2 minutos (los resultados del catálogo no cambian frecuentemente)
 *   - Paginación integrada
 *
 * Uso:
 *   const { data, isLoading, isError } = useVinylSearch('Dark Side', 1)
 *   // data.items → array de vinilos
 *   // data.total → total de resultados
 */

import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@constants/queryKeys'
import api from '@services/api'

export function useVinylSearch(searchTerm = '', page = 1, perPage = 20) {
  return useQuery({
    queryKey: [QUERY_KEYS.CATALOG_SEARCH, searchTerm, page, perPage],
    queryFn: async () => {
      const response = await api.get('/catalog', {
        params: {
          q: searchTerm,
          page,
          per_page: perPage,
        },
      })
      return response.data
    },
    // No ejecutar la query si el término es muy corto (evita spam de requests)
    enabled: searchTerm.length === 0 || searchTerm.length >= 3,
    staleTime: 1000 * 60 * 2,  // 2 minutos de cache
  })
}

export function useVinylDetail(vinylId) {
  return useQuery({
    queryKey: [QUERY_KEYS.VINYL_DETAIL, vinylId],
    queryFn: async () => {
      const response = await api.get(`/catalog/${vinylId}`)
      return response.data
    },
    enabled: !!vinylId,
    staleTime: 1000 * 60 * 5,  // 5 minutos (precio de Discogs se actualiza menos)
  })
}
