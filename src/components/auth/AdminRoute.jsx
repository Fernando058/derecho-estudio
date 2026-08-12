import {
  Navigate,
  useLocation,
} from 'react-router-dom'

import {
  LoaderCircle,
  ShieldAlert,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

function AdminRoute({ children }) {
  const {
    session,
    profile,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return (
      <main className="page">
        <section className="loading-state">
          <LoaderCircle size={36} />
          <h2>Verificando permisos...</h2>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  const hasAdminRole =
    profile?.role === 'admin' ||
    profile?.role === 'superadmin'

  if (!hasAdminRole) {
    return (
      <main className="page">
        <section className="auth-card">
          <ShieldAlert size={44} />

          <h1>Acceso restringido</h1>

          <p>
            Tu cuenta no dispone de permisos
            administrativos.
          </p>

          <Navigate
            to="/dashboard"
            replace
          />
        </section>
      </main>
    )
  }

  return children
}

export default AdminRoute