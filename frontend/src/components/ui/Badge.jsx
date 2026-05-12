const variants = {
  'Real Estate': 'bg-secondary-container text-on-secondary-container',
  Construction: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Funding: 'bg-primary-fixed text-on-primary-fixed-variant',
  Funded: 'bg-secondary-container text-on-secondary-container',
  'Under Review': 'bg-error text-on-error',
  Contacted: 'bg-error-container text-error border border-error',
  New: 'bg-surface-container-high text-on-surface-variant',
}

export default function Badge({ label }) {
  const cls = variants[label] ?? 'bg-surface-container-high text-on-surface-variant'
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${cls}`}>
      {label.toUpperCase()}
    </span>
  )
}
