import { useState } from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  GraduationCap,
  UserPlus,
} from 'lucide-react'

import { useAuth } from '../hooks/useAuth'

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
    ) ||
    message.includes(
      'already been registered',
    )
  ) {
    return 'Ya existe una cuenta asociada a este correo.'
  }

  if (
    message.includes(
      'email rate limit exceeded',
    ) ||
    error?.code ===
      'over_email_send_rate_limit'
  ) {
    return (
      'El registro por correo continúa solicitando una confirmación. ' +
      'La configuración de confirmación de correo debe estar desactivada ' +
      'en Supabase para utilizar el registro directo.'
    )
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

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')

    const normalizedName =
      fullName.trim()

    const normalizedEmail =
      email.trim()

    if (normalizedName.length < 3) {
      setError(
        'Ingrese sus nombres completos.',
      )

      return
    }

    if (password.length < 8) {
      setError(
        'La contraseña debe tener al menos 8 caracteres.',
      )

      return
    }

    setLoading(true)

    try {
      const {
        data,
        error: signUpError,
      } = await signUp({
        fullName: normalizedName,
        email: normalizedEmail,
        password,
      })

      if (signUpError) {
        throw signUpError
      }

      /*
        Con "Confirm email" desactivado en Supabase,
        signUp devuelve una sesión y el usuario puede
        entrar inmediatamente. El trigger existente
        on_auth_user_created crea public.profiles.
      */
      if (data?.session) {
        navigate(
          '/dashboard',
          { replace: true },
        )

        return
      }

      /*
        Si no existe sesión, la confirmación de correo
        sigue activa en el proyecto. No mostramos un
        mensaje de "correo enviado" porque Lex Academia
        v1.0.10 está preparada para registro directo.
      */
      setError(
        'La cuenta fue registrada, pero el proyecto todavía exige ' +
        'confirmación de correo. El administrador debe desactivar ' +
        '"Confirm email" en Supabase.',
      )
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

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <GraduationCap size={48} />

        <p className="eyebrow">
          Lex Academia
        </p>

        <h1>Crear cuenta</h1>

        <p className="auth-description">
          Crea tu cuenta gratuita para
          guardar progreso, resultados y
          estadísticas. No necesitas
          confirmar el correo.
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
            minLength={3}
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

          <small className="auth-field-help">
            Mínimo 8 caracteres.
          </small>

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            <UserPlus size={18} />

            {loading
              ? 'Creando cuenta...'
              : 'Crear cuenta gratuita'}
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
