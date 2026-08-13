import {
  LayoutDashboard,
} from 'lucide-react'
import {
  Link,
  useLocation,
} from 'react-router-dom'

function DashboardReturnButton() {
  const location = useLocation()

  if (location.pathname === '/dashboard') {
    return null
  }

  return (
    <Link
      aria-label="Volver al dashboard"
      className="dashboard-return-button"
      title="Volver al dashboard"
      to="/dashboard"
    >
      <LayoutDashboard size={21} />
      <span>Dashboard</span>
    </Link>
  )
}

export default DashboardReturnButton
