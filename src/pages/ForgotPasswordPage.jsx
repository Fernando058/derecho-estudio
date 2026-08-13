import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Mail,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setError('')
    setSent(false)

    try {
      const { error: resetError } =
        await requestPasswordReset(email)

      if (resetError) throw resetError

      setSent(true)
    } catch (requestError) {
      console.error(requestError)
      setError(
        requestError?.message ||
          'No fue posible solicitar la recuperación de contraseña.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <GraduationCap size={48} />
        <p className="eyebrow">Derecho Estudio</p>
        <h1>Recuperar contraseña</h1>

        <p className="auth-description">
          Ingresa el correo asociado a tu cuenta.
          Recibirás un enlace para establecer una nueva contraseña.
        </p>

        {sent && (
          <div className="auth-message auth-success">
            Si el correo corresponde a una cuenta válida,
            revisa tu bandeja de entrada y sigue el enlace de recuperación.
          </div>
        )}

        {error && (
          <div className="auth-message auth-error">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="recovery-email">
            Correo electrónico
          </label>

          <input
            id="recovery-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <button
            className="primary-button auth-submit"
            disabled={loading}
            type="submit"
          >
            <Mail size={18} />
            {loading
              ? 'Enviando...'
              : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <p className="auth-footer">
          <Link className="text-link" to="/login">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
