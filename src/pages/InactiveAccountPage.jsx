import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

function InactiveAccountPage() {
  const navigate = useNavigate()
  const {
    profile,
    signOut,
  } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <ShieldAlert size={52} />
        <p className="eyebrow">Acceso suspendido</p>
        <h1>Cuenta inactiva</h1>

        <p className="auth-description">
          La cuenta {profile?.email || ''} se encuentra desactivada
          para el acceso a las funciones privadas de Lex Academia.
          Contacta al administrador si consideras que se trata de un error.
        </p>

        <button
          className="button-danger auth-submit"
          onClick={handleLogout}
          type="button"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </section>
    </main>
  )
}

export default InactiveAccountPage
