import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import DarkOrbs from './DarkOrbs'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-space-bg flex relative">
      <DarkOrbs />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main
        className="
          flex-1
          min-h-screen
          relative z-10
          p-10
          lg:ml-[220px]          /* only apply margin on large screens */
          lg:max-w-[calc(100vw-220px)]
        "
      >
        <Outlet />
      </main>
    </div>
  )
}
