/**
 * Hook para gestión de usuarios desde el backoffice admin.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@constants/queryKeys'
import api from '@services/api'

export function useAdminUsers() {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_USERS],
    queryFn: async () => {
      const res = await api.get('/admin/users')
      return res.data
    },
  })

  const updateUser = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/admin/users/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_USERS] }),
  })

  const deleteUser = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_USERS] }),
  })

  return { usersQuery, updateUser, deleteUser }
}
