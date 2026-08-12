import { useState } from 'react'

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  GraduationCap,
  LogIn,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

function getLoginErrorMessage(error) {
  const message =
    error?.message?.toLowerCase() ?? ''

  if (
    message.includes(
      'invalid login credentials',
    )
  ) {
    return 'Correo o contraseña incorrectos.'
  }

  if (
    message.includes(
      'email not confirmed',
    )
  ) {
    return 'Debes confirmar tu correo antes de iniciar sesión.'
  }

  return (
    error?.message ||
    'No fue posible iniciar sesión.'
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { signIn } = useAuth()

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const destination =
    location.state?.from ||
    '/dashboard'

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const {
        error: signInError,
      } = await signIn({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      navigate(
        destination,
        {
          replace: true,
        },
      )
    } catch (loginError) {
      console.error(loginError)

      setError(
        getLoginErrorMessage(
          loginError,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <GraduationCap size={48} />

        <p className="eyebrow">
          Derecho Estudio
        </p>

        <h1>Iniciar sesión</h1>

        <p className="auth-description">
          Accede a tu progreso,
          simuladores y biblioteca.
        </p>

        {error && (
          <div className="auth-message auth-error">
            {error}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="email">
            Correo electrónico
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            autoComplete="email"
            required
          />

          <label htmlFor="password">
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            <LogIn size={18} />

            {loading
              ? 'Ingresando...'
              : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta?
          {' '}

          <Link
            to="/registro"
            className="text-link"
          >
            Registrarme
          </Link>
        </p>

        <Link
          to="/"
          className="back-link"
        >
          ← Volver al inicio
        </Link>
      </section>
    </main>
  )
}

export default LoginPage