export function BrandLogo({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${light ? 'text-brand-rose' : 'text-brand'} shrink-0`}>
        <rect x="3" y="3" width="23" height="28" rx="4" stroke="currentColor" strokeWidth="2.6" />
        <rect x="11" y="9" width="23" height="28" rx="4" fill={light ? '#302D2E' : '#F5F0E7'} stroke="currentColor" strokeWidth="2.6" />
        <path d="M16.5 23.5l4 4 8-8" stroke="currentColor" strokeWidth="2.6" />
      </svg>
      <span className={`font-manrope text-[22px] font-extrabold tracking-[-0.04em] ${light ? 'text-brand-oat' : 'text-brand-ink'}`}>tenancyportal</span>
    </div>
  )
}
