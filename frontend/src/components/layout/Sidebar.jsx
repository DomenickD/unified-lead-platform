import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/opportunities', icon: 'search_insights', label: 'Opportunity Discovery', badge: 3 },
  { to: '/funding', icon: 'account_balance', label: 'Funding Portal' },
  { to: '/leads', icon: 'leaderboard', label: 'Lead Management' },
  { to: '/map', icon: 'map', label: 'Map View' },
]

export default function Sidebar() {
  return (
    <aside className="bg-surface-container-low text-on-surface flex flex-col h-screen py-8 px-4 gap-2 border-r border-outline-variant fixed w-[280px] top-0 left-0 z-40">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance
            </span>
          </div>
          <div>
            <div className="text-base font-bold text-primary">Asset Management</div>
            <div className="text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant">Institutional Grade</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`
            }
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">{icon}</span>
              <span className="text-[11px] font-semibold tracking-widest uppercase">{label}</span>
            </div>
            {badge && (
              <span className="bg-error text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mx-2 mb-4 p-3 bg-error-container border border-error rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-error text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            report
          </span>
          <span className="text-[11px] font-semibold tracking-widest uppercase text-on-error-container">Critical Alert</span>
        </div>
        <p className="text-[13px] text-on-error-container font-semibold">
          Deal velocity in Phoenix has dropped below threshold.
        </p>
      </div>

      <div className="mt-auto pt-8 border-t border-outline-variant space-y-1">
        <button className="w-full bg-primary text-on-primary py-3 px-4 rounded text-[11px] font-semibold tracking-widest uppercase mb-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          New Funding Request
        </button>

        <NavLink to="/settings" className="flex items-center gap-2 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[11px] font-semibold tracking-widest uppercase">Settings</span>
        </NavLink>

        <a href="#" className="flex items-center gap-2 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all">
          <span className="material-symbols-outlined">contact_support</span>
          <span className="text-[11px] font-semibold tracking-widest uppercase">Support</span>
        </a>
      </div>
    </aside>
  )
}
