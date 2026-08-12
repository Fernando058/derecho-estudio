import {
  BookOpen,
  FileText,
  GraduationCap,
  Home,
  Layers3,
  ListTree,
  ShieldCheck,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Resumen', icon: Home, end: true },
  { to: '/admin/semestres', label: 'Semestres', icon: Layers3 },
  { to: '/admin/materias', label: 'Materias', icon: BookOpen },
  { to: '/admin/unidades', label: 'Unidades', icon: GraduationCap },
  { to: '/admin/temas', label: 'Temas', icon: ListTree },
  { to: '/admin/documentos', label: 'Documentos', icon: FileText, disabled: true },
]

function AdminShell({ title, description, children, actions }) {
  const { profile, isSuperAdmin } = useAuth()

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <ShieldCheck size={28} />
          <div>
            <strong>Derecho Estudio</strong>
            <span>Administración</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Navegación administrativa">
          {navItems.map(({ to, label, icon: Icon, end, disabled }) => {
            if (disabled) {
              return (
                <span className="admin-nav-link is-disabled" key={to}>
                  <Icon size={18} />
                  {label}
                  <small>Próximo</small>
                </span>
              )
            }

            return (
              <NavLink
                className={({ isActive }) =>
                  `admin-nav-link${isActive ? ' is-active' : ''}`
                }
                end={end}
                key={to}
                to={to}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            )
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-role-pill">
            {isSuperAdmin ? 'Superadmin' : 'Admin'}
          </span>
          <strong>{profile?.full_name || 'Administrador'}</strong>
          <span>{profile?.email}</span>
          <NavLink className="admin-back-link" to="/dashboard">
            ← Volver al dashboard
          </NavLink>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-content-header">
          <div>
            <p className="eyebrow">Panel administrativo</p>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="admin-header-actions">{actions}</div>}
        </header>

        {children}
      </section>
    </main>
  )
}

export default AdminShell
