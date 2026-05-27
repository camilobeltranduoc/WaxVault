/**
 * Dashboard Patrimonial — Módulo B.
 * TODO: Conectar con dashboardQuery de useCollection.
 */

import { useCollection } from '@hooks/useCollection'
import ValuationChart from '@components/dashboard/ValuationChart'
import LoadingSpinner from '@components/common/LoadingSpinner'
import { formatCurrency } from '@utils/formatters'

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
      <h1 className="text-3xl font-bold text-vinyl-black">📊 Dashboard Patrimonial</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Discos', value: stats.total_items, unit: '' },
          { label: 'Valor de Mercado', value: formatCurrency(stats.total_market_value), unit: '' },
          { label: 'Costo de Compra', value: formatCurrency(stats.total_purchase_cost), unit: '' },
          {
            label: 'Ganancia Potencial',
            value: formatCurrency(stats.unrealized_gain),
            unit: '',
            positive: stats.unrealized_gain >= 0,
          },
        ].map(({ label, value, positive }) => (
          <div key={label} className="card text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${positive !== undefined ? (positive ? 'text-green-600' : 'text-red-600') : 'text-vinyl-label'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <ValuationChart data={stats.valuation_history} />
    </div>
  )
}
