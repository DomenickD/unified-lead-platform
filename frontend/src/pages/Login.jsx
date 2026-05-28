import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [focused, setFocused] = useState(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      document.body.style.backgroundImage = `
        radial-gradient(at ${x}% ${y}%, rgba(186, 0, 53, 0.04) 0px, transparent 40%),
        radial-gradient(at 0% 0%, rgba(186, 0, 53, 0.03) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(19, 27, 46, 0.03) 0px, transparent 50%)
      `
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.style.backgroundImage = ''
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col text-on-surface" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
      {/* Header */}
      <header className="w-full flex justify-center pt-16 pb-8 px-4 md:px-12">
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-headline-lg text-primary-container tracking-tighter"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600 }}
          >
            CapitalStream
          </h1>
          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-outline-variant" />
            <p
              className="text-label-md text-on-surface-variant uppercase tracking-widest"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
            >
              Institutional Grade
            </p>
            <span className="h-px w-8 bg-outline-variant" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-4 pb-24">
        <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant rounded shadow-sm overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h2
                className="text-headline-md text-on-surface mb-2"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600 }}
              >
                Secure Access
              </h2>
              <p className="text-body-md text-on-surface-variant">
                Access your institutional capital management dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-label-md uppercase transition-colors"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    color: focused === 'email' ? '#131b2e' : '#45464d',
                  }}
                >
                  Institutional Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="name@firm.com"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all rounded-sm text-body-md"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="block text-label-md uppercase transition-colors"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: focused === 'password' ? '#131b2e' : '#45464d',
                    }}
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-secondary hover:underline transition-colors"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                  >
                    Forgot Password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all rounded-sm text-body-md"
                />
              </div>

              {/* Remember */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 text-primary-container border-outline-variant rounded-sm focus:ring-primary-container"
                />
                <label htmlFor="remember" className="ml-3 text-body-md text-on-surface-variant select-none">
                  Remember this device for 30 days
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-secondary text-on-secondary py-4 rounded-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-sm"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '18px', fontWeight: 600 }}
              >
                Sign In
              </button>
            </form>

            {/* Dev shortcut */}
            <button
              onClick={() => handleSubmit({ preventDefault: () => {} })}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-outline-variant rounded-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
            >
              <span className="material-symbols-outlined text-[16px]">developer_mode</span>
              DEV — Skip Login
            </button>

            {/* SSO Divider */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-outline-variant" />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-4 bg-surface-container-lowest text-on-surface-variant"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                >
                  SINGLE SIGN-ON
                </span>
              </div>
            </div>

            {/* SSO Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center justify-center gap-3 px-4 py-3 border border-outline-variant hover:bg-surface-container-low transition-colors rounded-sm">
                <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                <span className="text-body-md text-on-surface">Sign in with Okta / SAML</span>
              </button>
              <button className="flex items-center justify-center gap-3 px-4 py-3 border border-outline-variant hover:bg-surface-container-low transition-colors rounded-sm">
                <span className="material-symbols-outlined text-[20px]">cloud_done</span>
                <span className="text-body-md text-on-surface">Sign in with Azure AD</span>
              </button>
            </div>
          </div>

          {/* Security Footer */}
          <div className="bg-surface-container-low px-8 py-4 flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>verified_user</span>
            <p
              className="text-on-surface-variant"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
            >
              Encrypted Multi-Factor Authentication Active
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest border-t border-outline-variant py-4 px-4 md:px-12">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span
              className="text-primary font-bold"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
            >
              CAPITALSTREAM
            </span>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary-container rounded-sm">
              <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '14px' }}>account_balance</span>
              <span className="text-on-primary tracking-widest uppercase" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                SEC Registered
              </span>
            </div>
            <p className="text-body-md text-on-surface-variant">
              © 2024 CapitalStream Institutional Markets. All rights reserved.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            {['Terms of Funding', 'Data Attribution', 'Privacy Policy', 'Regulatory Disclosures'].map((link) => (
              <a key={link} href="#" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                {link}
              </a>
            ))}
          </nav>
        </div>
      </footer>

      {/* Background decoration */}
      <div className="fixed bottom-0 right-0 -z-10 opacity-20 hidden lg:block pointer-events-none">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWNGG1UMJs0zbMixVnhdKK7sF9z1552CUMW2L-GiYVGgonhaQlrLeZ1pm4Myba2NCkIBI0xC9mfIkbFPNxaZbdKNTVhwfos1Rkbba2H-Bz0ix-ogQMMYSYX2q7eQcB2g6dYJUk_LUxLtWSK2GYXQT2pmr6BUtFaKJnqskeAsTaDXHwiOz9guUv7uQ1VL8hRvQvS4pM8cqE5QQnf1N3FiBkBnF92_yVxPKxi7O3TSWud1oMMoqjwazTG9Gs7svUaFpUhuL1m8eC0i8"
          alt="Architectural abstraction"
          className="max-w-[600px]"
        />
      </div>
    </div>
  )
}
