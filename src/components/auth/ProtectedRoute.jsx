import {
  Navigate,
  useLocation,
} from 'react-router-dom'

import { LoaderCircle } from 'lucide-react'

import { useAuth } from '../../hooks/useAuth'

function ProtectedRoute({ children }) {
  const {
    session,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return (
      <main className="page">
        <section className="loading-state">
          <LoaderCircle size={36} />
          <h2>Verificando sesión...</h2>
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

  return children
}

export default ProtectedRoute