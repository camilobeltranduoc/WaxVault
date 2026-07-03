/**
 * Hook de búsqueda en el catálogo público de vinilos.
 * Usa master releases de Discogs: un resultado por álbum.
 *
 * Uso:
 *   const { data, isLoading } = useVinylSearch('Igor')
 *   // data.items → array de masters (un resultado por álbum)
 *
 *   const { data } = useVinylDetail('1000940')
 *   // data.versions → lista de prensados del álbum
 */

import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@constants/queryKeys'
import api from '@services/api'

export function useVinylFeatured() {
  return useQuery({
    queryKey: [QUERY_KEYS.CATALOG_SEARCH, '__featured__'],
    queryFn: async () => {
      const response = await api.get('/catalog/featured')
      return response.data
    },
    staleTime: 1000 * 60 * 60, // 1 hora — rota con el backend
  })
}

export function useVinylSearch(searchTerm = '', page = 1, perPage = 20) {
  return useQuery({
    queryKey: [QUERY_KEYS.CATALOG_SEARCH, searchTerm, page, perPage],
    queryFn: async () => {
      const response = await api.get('/catalog/', {
        params: { q: searchTerm, page, per_page: perPage },
      })
      return response.data
    },
    enabled: searchTerm.length >= 2,
    staleTime: 1000 * 60 * 2,
  })
}

export function useVinylDetail(masterId) {
  return useQuery({
    queryKey: [QUERY_KEYS.VINYL_DETAIL, masterId],
    queryFn: async () => {
      const response = await api.get(`/catalog/${masterId}`)
      return response.data
    },
    enabled: !!masterId,
    staleTime: 1000 * 60 * 10,
  })
}
