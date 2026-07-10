import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@constants/queryKeys'
import api from '@services/api'

export function useAdminCollections() {
  const queryClient = useQueryClient()

  const collectionsQuery = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_COLLECTIONS],
    queryFn: async () => {
      const res = await api.get('/admin/collections')
      return res.data
    },
  })

  const updateEntry = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/admin/collections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_COLLECTIONS] })
    },
  })

  const deleteEntry = useMutation({
    mutationFn: (id) => api.delete(`/admin/collections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_COLLECTIONS] })
    },
  })

  return { collectionsQuery, updateEntry, deleteEntry }
}
