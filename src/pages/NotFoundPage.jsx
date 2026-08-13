import { Link } from 'react-router-dom'
import {
  Home,
  SearchX,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

function NotFoundPage() {
  const { session } = useAuth()

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <SearchX size={52} />
        <p className="eyebrow">Error 404</p>
        <h1>Página no encontrada</h1>

        <p className="auth-description">
          La dirección solicitada no corresponde a un módulo disponible de Derecho Estudio.
        </p>

        <Link
          className="primary-button"
          to={session ? '/dashboard' : '/'}
        >
          <Home size={18} />
          {session ? 'Ir al dashboard' : 'Ir al inicio'}
        </Link>
      </section>
    </main>
  )
}

export default NotFoundPage
