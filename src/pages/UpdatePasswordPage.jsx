import { useState } from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import {
  KeyRound,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

function UpdatePasswordPage() {
  const navigate = useNavigate()

  const {
    session,
    updatePassword,
  } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess(false)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const {
        error: updateError,
      } = await updatePassword(password)

      if (updateError) throw updateError

      setSuccess(true)
      setPassword('')
      setConfirmPassword('')

      window.setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 900)
    } catch (updateError) {
      console.error(updateError)
      setError(
        updateError?.message ||
          'No fue posible actualizar la contraseña.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <KeyRound size={48} />
          <h1>Enlace no disponible</h1>
          <p className="auth-description">
            La sesión de recuperación no está activa.
            Solicita un nuevo enlace desde la pantalla de recuperación.
          </p>
          <Link className="primary-button" to="/recuperar-contrasena">
            Solicitar nuevo enlace
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <ShieldCheck size={48} />
        <p className="eyebrow">Seguridad de cuenta</p>
        <h1>Establecer nueva contraseña</h1>

        <p className="auth-description">
          Define una contraseña nueva de al menos 8 caracteres.
        </p>

        {success && (
          <div className="auth-message auth-success">
            Contraseña actualizada correctamente.
          </div>
        )}

        {error && (
          <div className="auth-message auth-error">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="new-password">
            Nueva contraseña
          </label>

          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="confirm-new-password">
            Confirmar contraseña
          </label>

          <input
            id="confirm-new-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <button
            className="primary-button auth-submit"
            disabled={loading}
            type="submit"
          >
            <KeyRound size={18} />
            {loading
              ? 'Actualizando...'
              : 'Guardar nueva contraseña'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default UpdatePasswordPage
