import { NavLink, useNavigate } from 'react-router-dom'

export default function Header({ onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login', { replace: true })
  }
  return (
    <header className="bg-surface text-on-surface flex justify-between items-center px-8 h-16 border-b border-outline-variant fixed top-0 right-0 left-[280px] z-50">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-primary">CapitalStream</span>
        <div className="h-6 w-px bg-outline-variant mx-2" />
        <nav className="hidden md:flex gap-4">
          <NavLink to="/dashboard" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            Market Data
          </NavLink>
          <a href="#" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            Resources
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex items-center bg-surface-container-low px-2 py-1 rounded border border-outline-variant">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-48 outline-none ml-1"
            placeholder="Search funding..."
            type="text"
          />
        </div>

        <div className="relative">
          <span className="material-symbols-outlined cursor-pointer hover:bg-surface-container-low p-2 rounded transition-colors">
            notifications
          </span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-white" />
        </div>

        <span className="material-symbols-outlined cursor-pointer hover:bg-surface-container-low p-2 rounded transition-colors">
          help_outline
        </span>

        <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-bold text-sm text-primary">
          U
        </div>

        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-secondary hover:bg-surface-container-low px-2 py-1.5 rounded transition-colors"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
        </button>
      </div>
    </header>
  )
}
