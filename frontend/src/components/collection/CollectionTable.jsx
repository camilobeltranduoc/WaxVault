import { formatCurrency, formatCondition, formatDate, formatProfitLoss } from '@utils/formatters'

const CONDITION_CLASS = {
  'M':   'condition-M',
  'NM':  'condition-NM',
  'VG+': 'condition-VGP',
  'VG':  'condition-VG',
  'G+':  'condition-GP',
  'G':   'condition-G',
  'F':   'condition-F',
  'P':   'condition-P',
}

function conditionClass(raw) {
  const label = formatCondition(raw)
  return CONDITION_CLASS[label] || CONDITION_CLASS[raw] || 'condition-F'
}

export default function CollectionTable({ entries = [], onEdit, onDelete }) {
  if (entries.length === 0) {
    return (
      <div className="card text-center py-16 border-2 border-dashed border-gray-200 bg-transparent shadow-none">
        <p className="text-5xl mb-4">🎵</p>
        <p className="text-lg font-semibold text-vinyl-black">Tu colección está vacía</p>
        <p className="text-sm text-gray-500 mt-2">
          Agrega tu primer vinilo haciendo clic en &quot;Agregar Vinilo&quot;.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl shadow-vinyl">
      <table className="w-full bg-white text-sm">
        <thead className="bg-vinyl-black text-vinyl-cream">
          <tr>
            <th className="px-4 py-3 text-left"><span className="label-mono">Vinilo</span></th>
            <th className="px-4 py-3 text-center"><span className="label-mono">Condición</span></th>
            <th className="px-4 py-3 text-right"><span className="label-mono">Compra</span></th>
            <th className="px-4 py-3 text-right"><span className="label-mono">Valor aprox.</span></th>
            <th className="px-4 py-3 text-right"><span className="label-mono">G/P</span></th>
            <th className="px-4 py-3 text-center"><span className="label-mono">Agregado</span></th>
            <th className="px-4 py-3 text-center"><span className="label-mono">Acciones</span></th>
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
              <tr
                key={entry.id}
                className="hover:bg-amber-50/40 border-l-4 border-transparent hover:border-vinyl-label transition-all duration-150"
              >
                {/* Carátula + título + artista */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-vinyl-groove shadow-sm">
                      <img
                        src={coverUrl || '/placeholder-vinyl.svg'}
                        alt={entry.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/placeholder-vinyl.svg' }}
                      />
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
                  <span className={`condition-badge ${conditionClass(entry.condition)}`}>
                    {formatCondition(entry.condition)}
                  </span>
                </td>

                <td className="px-4 py-3 text-right text-gray-600">
                  {formatCurrency(entry.purchase_price)}
                </td>

                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-vinyl-label bg-amber-50 rounded px-1.5 py-0.5">
                    {formatCurrency(entry.discogs_market_price)}
                  </span>
                </td>

                <td className={`px-4 py-3 text-right font-semibold ${isGain ? 'text-emerald-600' : 'text-red-500'}`}>
                  <span className="flex items-center justify-end gap-0.5">
                    {isGain ? '↑' : '↓'} {formatted}
                  </span>
                </td>

                <td className="px-4 py-3 text-center">
                  <span className="label-mono text-gray-400">{formatDate(entry.created_at)}</span>
                </td>

                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => onEdit?.(entry)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete?.(entry.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline transition-colors"
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
