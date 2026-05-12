export default function ProgressBar({ value, variant = 'secondary' }) {
  const barColor = variant === 'error' ? 'bg-error' : 'bg-secondary'
  return (
    <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
      <div className={`${barColor} h-full`} style={{ width: `${Math.min(100, value * 100)}%` }} />
    </div>
  )
}
