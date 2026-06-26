/**
 * Hook para gestión del catálogo desde el backoffice admin.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@constants/queryKeys'
import api from '@services/api'

export function useAdminCatalog() {
  const queryClient = useQueryClient()

  const catalogQuery = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_CATALOG],
    queryFn: async () => {
      const res = await api.get('/catalog', { params: { per_page: 100 } })
      return res.data
    },
  })

  const createVinyl = useMutation({
    mutationFn: (data) => api.post('/admin/catalog', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CATALOG] }),
  })

  const updateVinyl = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/admin/catalog/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CATALOG] }),
  })

  const archiveVinyl = useMutation({
    mutationFn: (id) => api.delete(`/admin/catalog/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CATALOG] }),
  })

  return { catalogQuery, createVinyl, updateVinyl, archiveVinyl }
}
