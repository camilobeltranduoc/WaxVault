/**
 * Hook para el flujo de aprobación de vinilos PENDING.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@constants/queryKeys'
import api from '@services/api'

export function useApprovals() {
  const queryClient = useQueryClient()

  const approvalsQuery = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_APPROVALS],
    queryFn: async () => {
      const res = await api.get('/admin/approvals')
      return res.data
    },
  })

  const approveVinyl = useMutation({
    mutationFn: (id) => api.post(`/admin/approvals/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_APPROVALS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CATALOG] })
    },
  })

  const rejectVinyl = useMutation({
    mutationFn: ({ id, reason }) =>
      api.post(`/admin/approvals/${id}/reject`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_APPROVALS] }),
  })

  return { approvalsQuery, approveVinyl, rejectVinyl }
}
