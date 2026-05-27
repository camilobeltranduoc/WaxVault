/**
 * Indicador de carga accesible con animación de vinilo girando.
 */

export default function LoadingSpinner({ size = 'md', label = 'Cargando...' }) {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-4',
  }

  return (
    <div
      className="flex flex-col items-center justify-center p-8 gap-3"
      role="status"
      aria-label={label}
    >
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-vinyl-label border-t-transparent`}
      />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  )
}
