import { Link } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useVinylFeatured } from '@hooks/useVinylSearch'

/* ─── Vinyl SVG ─────────────────────────────────────────── */
function VinylRecord() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full animate-vinyl-spin drop-shadow-2xl" aria-hidden="true">
      <defs>
        <radialGradient id="labelGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#e4b84a" />
          <stop offset="100%" stopColor="#b8942f" />
        </radialGradient>
        <radialGradient id="discGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill="url(#discGrad)" />
      {[90, 80, 70, 60, 50, 42, 35].map((r) => (
        <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#2d2d2d" strokeWidth="1.2" />
      ))}
      <ellipse cx="72" cy="68" rx="18" ry="10" fill="rgba(255,255,255,0.04)" transform="rotate(-30 72 68)" />
      <circle cx="100" cy="100" r="33" fill="url(#labelGrad)" />
      <circle cx="100" cy="100" r="29" fill="#c9a84c" />
      <text x="100" y="97" textAnchor="middle" fontSize="5.5" fill="#1a1a1a" fontFamily="Georgia, serif" fontWeight="bold">WaxVault</text>
      <text x="100" y="105" textAnchor="middle" fontSize="3.5" fill="#3a2e0a" fontFamily="Georgia, serif" letterSpacing="1">COLECCIÓN DIGITAL</text>
      <circle cx="100" cy="100" r="5.5" fill="#111" />
      <circle cx="100" cy="100" r="99" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
    </svg>
  )
}

/* ─── "Destacado ahora" widget ──────────────────────────── */
function DestacadoWidget({ vinyl, genre }) {
  const bars = [0.5, 0.9, 0.6, 1.0, 0.7, 0.45, 0.8, 0.55]

  return (
    <div className="animate-fade-in opacity-0-init delay-500
                   absolute bottom-8 right-6 md:right-10 lg:right-14 z-20
                   hidden sm:block">
      <div className="liquid-glass rounded-2xl border border-white/10 p-3.5 w-[248px]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="label-mono text-gray-400">Destacado ahora</span>
          <div className="flex items-end gap-[2.5px] h-3.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="w-[2px] bg-vinyl-label rounded-full origin-bottom"
                style={{
                  height: '14px',
                  animation: `eqBar ${0.45 + h * 0.55}s ease-in-out ${i * 70}ms infinite alternate`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {vinyl.cover_image_url ? (
            <img src={vinyl.cover_image_url} alt={vinyl.title}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-md" loading="lazy" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-vinyl-groove flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🎵</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white leading-snug truncate">{vinyl.title}</p>
            <p className="label-mono text-gray-500 truncate mt-0.5">{vinyl.artist}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-[3px] bg-white/8 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-vinyl-label rounded-full" style={{ width: '38%' }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="label-mono text-gray-500 capitalize">{genre}</span>
            <Link to="/catalog" className="label-mono text-vinyl-label hover:text-amber-300 transition-colors">
              Ver catálogo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Feature tiles data ───────────────────────────────── */
const FEATURES = [
  {
    icon: '📦',
    title: 'Inventario Completo',
    desc: 'Registra cada disco con metadata de Discogs: artista, año, label, género y formato.',
    tile: 'tile-amber',
    iconBg: 'bg-vinyl-black/15',
  },
  {
    icon: '💰',
    title: 'Tasación en Tiempo Real',
    desc: 'Precios actualizados del marketplace de Discogs para conocer el valor de tu patrimonio.',
    tile: 'tile-dark',
    iconBg: 'bg-vinyl-label/20',
  },
  {
    icon: '📊',
    title: 'Dashboard Patrimonial',
    desc: 'Visualiza la evolución del valor de tu colección con gráficos interactivos.',
    tile: 'tile-cream',
    iconBg: 'bg-vinyl-black/8',
  },
]

/* ─── Page ──────────────────────────────────────────────── */
export default function HomePage() {
  const { isAuthenticated, login } = useAuth()
  const { data: featured } = useVinylFeatured()
  const featuredVinyl = featured?.items?.[0]
  const featuredGenre = featured?.genre

  return (
    <div>
      {/* ── Hero — full-bleed ── */}
      <div
        className="relative overflow-hidden -mt-8"
        style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
      >
        {/* Fondo multicapa */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 70% 40%, rgba(201,168,76,0.10) 0%, transparent 55%),
              radial-gradient(ellipse 60% 70% at 20% 80%, rgba(58,46,10,0.45) 0%, transparent 50%),
              linear-gradient(135deg, #0d0d0d 0%, #1a1208 55%, #0c0901 100%)
            `,
          }}
        />

        {/* Grain */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0"
          aria-hidden="true" style={{ opacity: 0.045 }}>
          <filter id="grain-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.88" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-filter)" />
        </svg>

        {/* Orbs */}
        <div className="absolute pointer-events-none" style={{
          top: '15%', right: '20%', width: '480px', height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'floatOrb 15s ease-in-out infinite',
        }} />
        <div className="absolute pointer-events-none" style={{
          bottom: '10%', left: '15%', width: '320px', height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,80,20,0.18) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'floatOrb2 19s ease-in-out infinite',
        }} />

        {/* Contenido */}
        <div className="relative z-10 min-h-[calc(100vh-4rem)] flex flex-col justify-center
                        px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Texto */}
            <div className="text-center lg:text-left">

              {/* Badge */}
              <div className="animate-fade-in-up opacity-0-init mb-7 inline-flex">
                <span className="liquid-glass inline-flex items-center gap-2 rounded-full
                                 px-4 py-1.5 border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-vinyl-label"
                    style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                  <span className="label-mono text-gray-300">WaxVault · Colección de Vinilo</span>
                </span>
              </div>

              {/* Título con Bebas Neue */}
              <h1 className="animate-fade-in-up opacity-0-init delay-100
                             font-display leading-[0.92] mb-6 text-white
                             text-[5rem] sm:text-[6rem] lg:text-[7rem] xl:text-[7.5rem]">
                TU COLECCIÓN<br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #c9a84c 0%, #f0d080 45%, #d4a843 100%)' }}>
                  DE VINILOS,
                </span>
                <br />EN LA NUBE.
              </h1>

              {/* Subtítulo */}
              <p className="animate-fade-in-up opacity-0-init delay-200
                            text-base sm:text-lg text-gray-400 mb-10 leading-relaxed
                            max-w-md mx-auto lg:mx-0">
                Catalogar, tasar y gestionar tu inventario de discos en tiempo real.
                Precios actualizados desde el marketplace de Discogs.
              </p>

              {/* CTAs */}
              <div className="animate-fade-in-up opacity-0-init delay-300
                              flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/catalog"
                  className="bg-white text-vinyl-black font-mono font-bold uppercase
                             tracking-[0.12em] text-sm px-8 py-3.5 rounded-full
                             shadow-lg hover:bg-vinyl-label hover:shadow-vinyl-glow
                             transition-all duration-200">
                  Explorar catálogo
                </Link>
                {!isAuthenticated ? (
                  <button onClick={login}
                    className="liquid-glass border border-white/15 text-white font-mono font-bold
                               uppercase tracking-[0.12em] text-sm px-8 py-3.5 rounded-full
                               hover:border-white/35 transition-all duration-200">
                    Iniciar sesión
                  </button>
                ) : (
                  <Link to="/collection"
                    className="liquid-glass border border-white/15 text-white font-mono font-bold
                               uppercase tracking-[0.12em] text-sm px-8 py-3.5 rounded-full
                               hover:border-white/35 transition-all duration-200">
                    Mi colección
                  </Link>
                )}
              </div>
            </div>

            {/* Vinilo */}
            <div className="animate-fade-in opacity-0-init delay-200 flex justify-center lg:justify-end">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px] xl:w-[480px] xl:h-[480px]">
                <div className="absolute inset-6 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)',
                    filter: 'blur(28px)',
                  }} />
                <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
                <VinylRecord />
              </div>
            </div>
          </div>
        </div>

        {featuredVinyl && <DestacadoWidget vinyl={featuredVinyl} genre={featuredGenre} />}
      </div>

      {/* ── Features — color-block tiles ── */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto">
          <p className="label-mono text-gray-400 text-center mb-2">Características</p>
          <h2 className="font-display text-4xl text-vinyl-black text-center mb-10 tracking-wide">
            TODO LO QUE NECESITAS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc, tile, iconBg }, i) => (
              <div
                key={title}
                className={`${tile} hover:opacity-95 hover:scale-[1.01] transition-all duration-200
                            animate-fade-in-up opacity-0-init`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${iconBg} text-2xl mb-5`}>
                  {icon}
                </div>
                <h3 className="font-display text-2xl mb-2 tracking-wide">{title.toUpperCase()}</h3>
                <p className="text-sm leading-relaxed opacity-75">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
