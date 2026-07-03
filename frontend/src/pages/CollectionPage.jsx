/**
 * Colección personal del usuario — Módulo B.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '@hooks/useCollection'
import { CollectionProvider } from '@context/CollectionContext'
import CollectionTable from '@components/collection/CollectionTable'
import EditEntryModal from '@components/collection/EditEntryModal'
import LoadingSpinner from '@components/common/LoadingSpinner'

function CollectionContent() {
  const { collectionQuery, deleteEntry } = useCollection()
  const { data, isLoading, isError } = collectionQuery
  const [editingEntry, setEditingEntry] = useState(null)

  if (isLoading) return <LoadingSpinner label="Cargando tu colección..." />

  if (isError) {
    return (
      <div className="card text-center py-8">
        <p className="text-red-600">Error al cargar la colección.</p>
      </div>
    )
  }

  return (
    <>
      <CollectionTable
        entries={data?.items || []}
        onEdit={(entry) => setEditingEntry(entry)}
        onDelete={(id) => deleteEntry.mutate(id)}
      />
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </>
  )
}

export default function CollectionPage() {
  return (
    <CollectionProvider>
      <div>
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="label-mono text-gray-400 mb-1">Módulo B</p>
            <h1 className="font-display text-5xl text-vinyl-black tracking-wide">MI COLECCIÓN</h1>
          </div>
          <Link to="/collection/add" className="btn-primary">
            + Agregar Vinilo
          </Link>
        </div>
        <CollectionContent />
      </div>
    </CollectionProvider>
  )
}
