import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LeadManagement from './pages/LeadManagement'
import OpportunityDiscovery from './pages/OpportunityDiscovery'
import FundingPortal from './pages/FundingPortal'
import MapView from './pages/MapView'
import Settings from './pages/Settings'

export default function App() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('cs_auth') === 'true'
  )

  const handleLogin = () => {
    sessionStorage.setItem('cs_auth', 'true')
    setAuthenticated(true)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={authenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/"
          element={authenticated ? <AppShell /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="opportunities" element={<OpportunityDiscovery />} />
          <Route path="funding" element={<FundingPortal />} />
          <Route path="leads" element={<LeadManagement />} />
          <Route path="map" element={<MapView />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to={authenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
