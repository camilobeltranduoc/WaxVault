import { Link } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

export default function HomePage() {
  const { isAuthenticated, login } = useAuth()

  return (
    <div className="text-center py-20 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-8xl mb-6">🎵</div>
      <h1 className="text-5xl font-bold text-vinyl-black mb-4">
        Tu colección de vinilo,{' '}
        <span className="text-vinyl-label">en la nube</span>
      </h1>
      <p className="text-xl text-gray-600 mb-10 leading-relaxed">
        WaxVault es la plataforma para catalogar, gestionar y tasar tu inventario de
        discos de vinilo en tiempo real con precios de Discogs.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/catalog" className="btn-primary text-lg px-8 py-3">
          Ver Catálogo
        </Link>
        {!isAuthenticated && (
          <button
            onClick={login}
            className="btn-secondary text-lg px-8 py-3"
          >
            Crear mi colección
          </button>
        )}
        {isAuthenticated && (
          <Link to="/collection" className="btn-secondary text-lg px-8 py-3">
            Mi Colección
          </Link>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 text-left">
        {[
          { icon: '📦', title: 'Inventario Completo', desc: 'Registra cada disco con metadata de Discogs: artista, año, label, género y formato.' },
          { icon: '💰', title: 'Tasación en Tiempo Real', desc: 'Precios actualizados del marketplace de Discogs para saber el valor de tu patrimonio.' },
          { icon: '📊', title: 'Dashboard Patrimonial', desc: 'Visualiza la evolución del valor de tu colección con gráficos interactivos.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card">
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="font-bold text-vinyl-black mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
