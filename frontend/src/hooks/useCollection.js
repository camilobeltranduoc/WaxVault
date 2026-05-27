/**
 * Hook para gestión de la colección personal del usuario.
 *
 * Encapsula todas las operaciones CRUD sobre la colección usando
 * TanStack Query para cache, loading states y sincronización automática.
 *
 * Uso:
 *   const { collectionQuery, addEntry, updateEntry, deleteEntry } = useCollection()
 *   const { data, isLoading, isError } = collectionQuery
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@constants/queryKeys'
import api from '@services/api'

export function useCollection() {
  const queryClient = useQueryClient()

  // -------------------------------------------------------------------------
  // READ — Listar mi colección
  // -------------------------------------------------------------------------
  const collectionQuery = useQuery({
    queryKey: [QUERY_KEYS.COLLECTION],
    queryFn: async () => {
      const response = await api.get('/collection')
      return response.data
    },
  })

  // -------------------------------------------------------------------------
  // READ — Dashboard patrimonial
  // -------------------------------------------------------------------------
  const dashboardQuery = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS],
    queryFn: async () => {
      const response = await api.get('/collection/dashboard')
      return response.data
    },
  })

  // -------------------------------------------------------------------------
  // CREATE — Agregar vinilo a la colección
  // -------------------------------------------------------------------------
  const addEntry = useMutation({
    mutationFn: (newEntry) => api.post('/collection', newEntry),
    onSuccess: () => {
      // Invalida el cache para refetch automático de la lista
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COLLECTION] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
    },
  })

  // -------------------------------------------------------------------------
  // UPDATE — Actualizar entrada (condición, precio, notas)
  // -------------------------------------------------------------------------
  const updateEntry = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/collection/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COLLECTION] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
    },
  })

  // -------------------------------------------------------------------------
  // DELETE — Eliminar entrada de la colección
  // -------------------------------------------------------------------------
  const deleteEntry = useMutation({
    mutationFn: (entryId) => api.delete(`/collection/${entryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COLLECTION] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
    },
  })

  return {
    collectionQuery,
    dashboardQuery,
    addEntry,
    updateEntry,
    deleteEntry,
  }
}
