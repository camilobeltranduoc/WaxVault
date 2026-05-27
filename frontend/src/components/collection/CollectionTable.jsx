/**
 * Tabla de la colección personal del usuario.
 * TODO: Implementar con datos reales del hook useCollection().
 */

import { formatCurrency, formatCondition, formatDate, formatProfitLoss } from '@utils/formatters'

export default function CollectionTable({ entries = [], onEdit, onDelete }) {
  if (entries.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-4xl mb-4">🎵</p>
        <p className="text-lg font-semibold text-vinyl-black">Tu colección está vacía</p>
        <p className="text-sm text-gray-500 mt-2">
          Agrega tu primer vinilo haciendo clic en &quot;Agregar Vinilo&quot;.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow-vinyl">
      <table className="w-full bg-white text-sm">
        <thead className="bg-vinyl-black text-vinyl-cream">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Vinilo</th>
            <th className="px-4 py-3 text-left font-semibold">Artista</th>
            <th className="px-4 py-3 text-center font-semibold">Condición</th>
            <th className="px-4 py-3 text-right font-semibold">Compra</th>
            <th className="px-4 py-3 text-right font-semibold">Mercado</th>
            <th className="px-4 py-3 text-right font-semibold">G/P</th>
            <th className="px-4 py-3 text-center font-semibold">Agregado</th>
            <th className="px-4 py-3 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => {
            const { formatted, isGain } = formatProfitLoss(
              entry.vinyl?.discogs_market_price,
              entry.purchase_price
            )
            return (
              <tr key={entry.id} className="hover:bg-vinyl-cream transition-colors">
                <td className="px-4 py-3 font-medium">{entry.vinyl?.title || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{entry.vinyl?.artist || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className="condition-badge">{formatCondition(entry.condition)}</span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {formatCurrency(entry.purchase_price)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-vinyl-label">
                  {formatCurrency(entry.vinyl?.discogs_market_price)}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                  {formatted}
                </td>
                <td className="px-4 py-3 text-center text-gray-400 text-xs">
                  {formatDate(entry.created_at)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit?.(entry)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete?.(entry.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
