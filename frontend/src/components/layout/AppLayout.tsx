import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import DarkOrbs from './DarkOrbs'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-space-bg flex relative">
      <DarkOrbs />
      <Sidebar />
      <main className="flex-1 ml-[220px] min-h-screen relative z-10 p-10 max-w-[calc(100vw-220px)]">
        <Outlet />
      </main>
    </div>
  )
}
