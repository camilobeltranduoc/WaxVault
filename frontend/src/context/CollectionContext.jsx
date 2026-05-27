/**
 * Contexto de UI para la colección personal.
 *
 * Maneja estado de UI local (filtros, entrada seleccionada) que necesita
 * ser compartido entre componentes de la misma página sin subir al
 * estado global ni a TanStack Query.
 *
 * El estado de SERVER (datos reales de la colección) lo maneja
 * useCollection() via TanStack Query.
 */

import { createContext, useContext, useState } from 'react'

const CollectionContext = createContext(null)

export function CollectionProvider({ children }) {
  /** Entrada de colección seleccionada para editar/ver detalle */
  const [selectedEntry, setSelectedEntry] = useState(null)

  /** Filtro activo por condición ("all" | "M" | "NM" | "VG+" | etc.) */
  const [filterCondition, setFilterCondition] = useState('all')

  /** Término de búsqueda local (filtra en el frontend sin nueva request) */
  const [searchTerm, setSearchTerm] = useState('')

  /** Ordenamiento activo */
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const value = {
    selectedEntry,
    setSelectedEntry,
    filterCondition,
    setFilterCondition,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  }

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  )
}

export function useCollectionContext() {
  const ctx = useContext(CollectionContext)
  if (!ctx) {
    throw new Error('useCollectionContext debe usarse dentro de <CollectionProvider>')
  }
  return ctx
}
