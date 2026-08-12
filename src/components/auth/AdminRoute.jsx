import {
  Navigate,
  useLocation,
} from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function AdminRoute({ children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="page">
        <section className="loading-state">
          <LoaderCircle className="spin" size={36} />
          <h2>Verificando permisos...</h2>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname }}
        to="/login"
      />
    )
  }

  const hasAdminRole =
    profile?.role === 'admin' ||
    profile?.role === 'superadmin'

  if (!hasAdminRole) {
    return <Navigate replace to="/dashboard" />
  }

  return children
}

export default AdminRoute
