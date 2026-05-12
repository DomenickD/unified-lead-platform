export default function MetricCard({ label, value, sub, icon, variant = 'default' }) {
  const isAlert = variant === 'alert'

  return (
    <div
      className={`bg-white p-4 border rounded-lg ${
        isAlert ? 'border-error ring-1 ring-error ring-opacity-10' : 'border-outline-variant'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[11px] font-semibold tracking-widest uppercase ${isAlert ? 'text-error' : 'text-on-surface-variant'}`}>
          {label}
        </span>
        <span className={`material-symbols-outlined ${isAlert ? 'text-error' : 'text-on-surface-variant'}`}>{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-on-surface">{value}</div>
      <div className={`text-[13px] font-medium mt-1 ${isAlert ? 'text-error flex items-center gap-1' : 'text-secondary'}`}>
        {isAlert && <span className="material-symbols-outlined text-[14px]">warning</span>}
        {sub}
      </div>
    </div>
  )
}
