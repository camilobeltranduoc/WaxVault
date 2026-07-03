import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@utils/formatters'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card !p-3 shadow-xl border border-vinyl-label/30">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-vinyl-label text-base">
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
        <div className="h-[300px] flex flex-col items-center justify-center gap-3">
          <p className="text-4xl">📀</p>
          <p className="text-gray-400 text-sm text-center">
            Agrega vinilos a tu colección para ver el historial de tasación.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="vinylGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="value"
              stroke="#c9a84c"
              strokeWidth={3}
              fill="url(#vinylGradient)"
              dot={{ fill: '#c9a84c', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, fill: '#c9a84c', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
