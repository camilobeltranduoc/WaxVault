/**
 * Gráfico de historial de tasación patrimonial.
 * Usa recharts LineChart para mostrar la evolución del valor total
 * de la colección a lo largo del tiempo.
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@utils/formatters'

/** Tooltip personalizado con estilo WaxVault */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card !p-3 shadow-xl border border-vinyl-label/30">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-vinyl-label">
        {formatCurrency(payload[0]?.value)}
      </p>
    </div>
  )
}

export default function ValuationChart({ data = [] }) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-vinyl-black mb-6">
        📈 Evolución del Valor Patrimonial
      </h2>

      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-gray-400 text-sm">
            Agrega vinilos a tu colección para ver el historial de tasación.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${v.toLocaleString()}`}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#c9a84c"
              strokeWidth={2.5}
              dot={{ fill: '#c9a84c', r: 4 }}
              activeDot={{ r: 6, fill: '#c9a84c' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
