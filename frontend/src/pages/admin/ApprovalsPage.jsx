/**
 * Bandeja de aprobación de vinilos — Módulo C.
 * TODO: Conectar con GET /api/admin/approvals y acciones approve/reject.
 */

export default function ApprovalsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-vinyl-black mb-2">✅ Bandeja de Aprobación</h1>
      <p className="text-gray-500 mb-6">
        Vinilos creados por usuarios que están pendientes de revisión.
      </p>
      <div className="card text-center py-12">
        <p className="text-2xl mb-3">🎉</p>
        <p className="text-lg font-semibold">No hay vinilos pendientes</p>
        <p className="text-sm text-gray-500 mt-2">
          Cuando los usuarios creen vinilos, aparecerán aquí para aprobación.
        </p>
      </div>
    </div>
  )
}
