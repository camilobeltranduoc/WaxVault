export function VinylIcon({ size = 32, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="50" fill="#1a1a1a" />
      <circle cx="50" cy="50" r="44"   fill="none" stroke="#c9a84c" strokeWidth="4.5" />
      <circle cx="50" cy="50" r="36.5" fill="none" stroke="#c9a84c" strokeWidth="4"   />
      <circle cx="50" cy="50" r="29.5" fill="none" stroke="#c9a84c" strokeWidth="3.5" />
      <circle cx="50" cy="50" r="23"   fill="none" stroke="#c9a84c" strokeWidth="3"   />
      <circle cx="50" cy="50" r="17"   fill="none" stroke="#c9a84c" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="10.5" fill="#c9a84c" />
      <circle cx="50" cy="50" r="3.5"  fill="#1a1a1a" />
    </svg>
  )
}

export function WaxVaultLogo({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 select-none ${className}`}>
      <VinylIcon size={30} />
      <span className="font-display text-2xl tracking-wider leading-none">
        <span className="text-vinyl-cream">WAX</span>
        <span className="text-vinyl-label">VAULT</span>
      </span>
    </span>
  )
}
