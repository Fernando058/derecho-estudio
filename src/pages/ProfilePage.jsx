import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  KeyRound,
  Save,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { updateMyProfile } from '../services/profileService'

function ProfilePage() {
  const {
    user,
    profile,
    refreshProfile,
    updatePassword,
  } = useAuth()

  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setAvatarUrl(profile?.avatar_url ?? '')
  }, [profile?.avatar_url, profile?.full_name])

  async function handleProfileSubmit(event) {
    event.preventDefault()

    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      await updateMyProfile({
        userId: user.id,
        fullName,
        avatarUrl,
      })

      await refreshProfile()
      setProfileSuccess('Perfil actualizado correctamente.')
    } catch (error) {
      console.error(error)
      setProfileError(
        error?.message ||
          'No fue posible actualizar el perfil.',
      )
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()

    setPasswordError('')
    setPasswordSuccess('')

    if (password.length < 8) {
      setPasswordError(
        'La contraseña debe tener al menos 8 caracteres.',
      )
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.')
      return
    }

    setPasswordLoading(true)

    try {
      const {
        error,
      } = await updatePassword(password)

      if (error) throw error

      setPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Contraseña actualizada correctamente.')
    } catch (error) {
      console.error(error)
      setPasswordError(
        error?.message ||
          'No fue posible cambiar la contraseña.',
      )
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <main className="page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Mi cuenta</p>
          <h1>Perfil y seguridad</h1>
          <p>
            Actualiza tus datos visibles y administra la contraseña de acceso.
          </p>
        </div>

        <Link className="button-secondary" to="/dashboard">
          ← Dashboard
        </Link>
      </section>

      <section className="profile-settings-grid">
        <article className="feature-card">
          <UserRound size={34} />
          <h2>Información personal</h2>

          <div className="profile-identity">
            {avatarUrl ? (
              <img
                alt=""
                className="profile-avatar"
                src={avatarUrl}
              />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">
                {(fullName || profile?.email || 'U')
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div>
              <strong>{profile?.full_name || 'Usuario'}</strong>
              <span>{profile?.email}</span>
              <span className="status-badge">{profile?.role}</span>
            </div>
          </div>

          {profileSuccess && (
            <div className="auth-message auth-success">
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="auth-message auth-error">
              {profileError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleProfileSubmit}>
            <label htmlFor="profile-name">
              Nombres completos
            </label>

            <input
              id="profile-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />

            <label htmlFor="profile-email">
              Correo
            </label>

            <input
              id="profile-email"
              value={profile?.email ?? ''}
              disabled
            />

            <label htmlFor="profile-avatar">
              URL de avatar (opcional)
            </label>

            <input
              id="profile-avatar"
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
            />

            <button
              className="primary-button auth-submit"
              disabled={profileLoading}
              type="submit"
            >
              <Save size={18} />
              {profileLoading
                ? 'Guardando...'
                : 'Guardar perfil'}
            </button>
          </form>
        </article>

        <article className="feature-card">
          <KeyRound size={34} />
          <h2>Cambiar contraseña</h2>
          <p className="auth-description">
            La nueva contraseña debe tener al menos 8 caracteres.
          </p>

          {passwordSuccess && (
            <div className="auth-message auth-success">
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="auth-message auth-error">
              {passwordError}
            </div>
          )}

          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            <label htmlFor="profile-password">
              Nueva contraseña
            </label>

            <input
              id="profile-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <label htmlFor="profile-password-confirm">
              Confirmar contraseña
            </label>

            <input
              id="profile-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <button
              className="button-secondary auth-submit"
              disabled={passwordLoading}
              type="submit"
            >
              <KeyRound size={18} />
              {passwordLoading
                ? 'Actualizando...'
                : 'Cambiar contraseña'}
            </button>
          </form>
        </article>
      </section>
    </main>
  )
}

export default ProfilePage
