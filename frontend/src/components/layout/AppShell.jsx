import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function AppShell() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-[280px]">
        <Header />
        <main className="flex-1 p-8 pt-24 overflow-y-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
