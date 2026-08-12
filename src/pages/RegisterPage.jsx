import { useState } from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  CheckCircle2,
  GraduationCap,
  UserPlus,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

function getRegisterErrorMessage(error) {
  const message =
    error?.message?.toLowerCase() ?? ''

  if (
    message.includes(
      'password should be at least',
    )
  ) {
    return 'La contraseña no cumple la longitud mínima.'
  }

  if (
    message.includes(
      'user already registered',
    )
  ) {
    return 'Ya existe una cuenta asociada a este correo.'
  }

  return (
    error?.message ||
    'No fue posible crear la cuenta.'
  )
}

function RegisterPage() {
  const navigate = useNavigate()

  const { signUp } = useAuth()

  const [fullName, setFullName] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess(false)

    if (password.length < 8) {
      setError(
        'La contraseña debe tener al menos 8 caracteres.',
      )

      return
    }

    if (password !== confirmPassword) {
      setError(
        'Las contraseñas no coinciden.',
      )

      return
    }

    setLoading(true)

    try {
      const {
        data,
        error: signUpError,
      } = await signUp({
        fullName,
        email,
        password,
      })

      if (signUpError) {
        throw signUpError
      }

      if (data?.session) {
        navigate(
          '/dashboard',
          { replace: true },
        )

        return
      }

      setSuccess(true)

      setPassword('')
      setConfirmPassword('')
    } catch (registerError) {
      console.error(registerError)

      setError(
        getRegisterErrorMessage(
          registerError,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <CheckCircle2
            size={52}
            className="auth-success-icon"
          />

          <h1>Cuenta creada</h1>

          <p>
            Hemos enviado un mensaje de
            confirmación a:
          </p>

          <strong>{email}</strong>

          <p>
            Abre el correo y confirma tu
            dirección antes de iniciar sesión.
          </p>

          <Link
            to="/login"
            className="primary-button"
          >
            Ir a iniciar sesión
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <GraduationCap size={48} />

        <p className="eyebrow">
          Derecho Estudio
        </p>

        <h1>Crear cuenta</h1>

        <p className="auth-description">
          Regístrate para guardar tu progreso,
          resultados y estadísticas.
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
          <label htmlFor="full-name">
            Nombres completos
          </label>

          <input
            id="full-name"
            type="text"
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target.value,
              )
            }
            autoComplete="name"
            required
          />

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
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="confirm-password">
            Confirmar contraseña
          </label>

          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value,
              )
            }
            autoComplete="new-password"
            minLength={8}
            required
          />

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            <UserPlus size={18} />

            {loading
              ? 'Creando cuenta...'
              : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes una cuenta?
          {' '}

          <Link
            to="/login"
            className="text-link"
          >
            Iniciar sesión
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

export default RegisterPage