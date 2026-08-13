import {
  BookMarked,
  House,
  LayoutDashboard,
  LogIn,
  Scale,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import {
  Link,
  NavLink,
  useLocation,
} from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

function navClass({ isActive }) {
  return `main-nav-link${isActive ? ' is-active' : ''}`
}

function MainNavbar() {
  const location = useLocation()
  const {
    session,
    isAdmin,
  } = useAuth()

  if (location.pathname.startsWith('/admin')) {
    return null
  }

  return (
    <header className="main-navbar-shell">
      <nav
        aria-label="Navegación principal"
        className="main-navbar"
      >
        <Link
          className="main-navbar-brand"
          to="/"
        >
          <span className="main-navbar-mark">
            <Scale size={25} />
          </span>

          <span className="main-navbar-brand-copy">
            <strong>LEX ACADEMIA</strong>
            <small>Plataforma Académica Jurídica</small>
          </span>
        </Link>

        <div className="main-navbar-links">
          <NavLink
            className={navClass}
            end
            to="/"
          >
            <House size={18} />
            <span>Inicio</span>
          </NavLink>

          {session && (
            <NavLink
              className={navClass}
              to="/dashboard"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          )}

          {session && (
            <NavLink
              className={navClass}
              to="/documentos"
            >
              <BookMarked size={18} />
              <span>Biblioteca</span>
            </NavLink>
          )}

          <NavLink
            className={navClass}
            to="/acerca"
          >
            <Scale size={18} />
            <span>Acerca de</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              className={navClass}
              to="/admin"
            >
              <ShieldCheck size={18} />
              <span>Administración</span>
            </NavLink>
          )}
        </div>

        <div className="main-navbar-account">
          {!session ? (
            <>
              <Link
                className="main-nav-account-link"
                to="/login"
              >
                <LogIn size={18} />
                Ingresar
              </Link>

              <Link
                className="main-nav-account-link is-primary"
                to="/registro"
              >
                <UserPlus size={18} />
                Registrarse
              </Link>
            </>
          ) : (
            <Link
              className="main-nav-account-link is-primary"
              to="/perfil"
            >
              Mi perfil
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

export default MainNavbar
