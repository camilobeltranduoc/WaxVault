import { useCollection } from '@hooks/useCollection'
import ValuationChart from '@components/dashboard/ValuationChart'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatCurrency } from '@utils/formatters'

const KPI_CONFIG = [
  {
    key: 'total_items',
    label: 'Total Discos',
    icon: '🎵',
    dotColor: 'bg-indigo-400',
    valueClass: 'text-indigo-700',
    format: (v) => v,
  },
  {
    key: 'total_market_value',
    label: 'Valor de Mercado',
    icon: '💰',
    dotColor: 'bg-vinyl-label',
    valueClass: 'text-amber-700',
    format: formatCurrency,
  },
  {
    key: 'total_purchase_cost',
    label: 'Costo de Compra',
    icon: '🛒',
    dotColor: 'bg-teal-400',
    valueClass: 'text-teal-700',
    format: formatCurrency,
  },
  {
    key: 'unrealized_gain',
    label: 'Ganancia Potencial',
    icon: '📈',
    dotColor: null,
    valueClass: null,
    format: formatCurrency,
  },
]

export default function DashboardPage() {
  const { dashboardQuery } = useCollection()
  const { data, isLoading } = dashboardQuery

  if (isLoading) return <LoadingSpinner label="Calculando patrimonio..." />

  const stats = data || {
    total_items: 0,
    total_market_value: 0,
    total_purchase_cost: 0,
    unrealized_gain: 0,
    valuation_history: [],
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-gray-400 mb-1">Módulo B</p>
        <h1 className="font-display text-5xl text-vinyl-black tracking-wide">DASHBOARD PATRIMONIAL</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CONFIG.map(({ key, label, icon, dotColor, valueClass, format }, i) => {
          const value = stats[key]
          const isGain = key === 'unrealized_gain'
          const gainPositive = isGain && value >= 0
          const dot = dotColor || (gainPositive ? 'bg-emerald-400' : 'bg-red-400')
          const valClass = valueClass || (gainPositive ? 'text-emerald-700' : 'text-red-600')

          return (
            <div
              key={key}
              className="card border border-vinyl-groove/15 animate-fade-in-up opacity-0-init"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <p className="label-mono text-gray-400">{label}</p>
              </div>
              <p className={`text-2xl font-bold ${valClass}`}>
                {format(value)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Gráfico */}
      <ValuationChart data={stats.valuation_history} />
    </div>
  )
}
