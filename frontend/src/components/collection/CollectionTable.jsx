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
            <th className="px-4 py-3 text-center font-semibold">Condición</th>
            <th className="px-4 py-3 text-right font-semibold">Compra</th>
            <th className="px-4 py-3 text-right font-semibold">Valor aprox.</th>
            <th className="px-4 py-3 text-right font-semibold">G/P</th>
            <th className="px-4 py-3 text-center font-semibold">Agregado</th>
            <th className="px-4 py-3 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => {
            const { formatted, isGain } = formatProfitLoss(
              entry.discogs_market_price,
              entry.purchase_price
            )
            const coverUrl = entry.cover_override_url || entry.cover_image_url

            return (
              <tr key={entry.id} className="hover:bg-vinyl-cream transition-colors">
                {/* Carátula + título + artista */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-vinyl-groove shadow-sm">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={entry.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/placeholder-vinyl.svg' }}
                        />
                      ) : (
                        <img
                          src="/placeholder-vinyl.svg"
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-vinyl-black truncate max-w-[180px]">
                        {entry.title || '—'}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">
                        {entry.artist || '—'}
                      </p>
                      {entry.year && (
                        <p className="text-xs text-gray-400">{entry.year}</p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-center">
                  <span className="condition-badge">{formatCondition(entry.condition)}</span>
                </td>

                <td className="px-4 py-3 text-right text-gray-600">
                  {formatCurrency(entry.purchase_price)}
                </td>

                <td className="px-4 py-3 text-right font-semibold text-vinyl-label">
                  {formatCurrency(entry.discogs_market_price)}
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
