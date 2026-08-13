import {
  BarChart3,
  BadgeCheck,
  BookMarked,
  BookOpenCheck,
  FileBadge2,
  FilePenLine,
  FileQuestion,
  FileText,
  LayoutDashboard,
  ListTree,
  Scale,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/admin', label: 'Resumen', icon: Scale, end: true },
  { to: '/admin/semestres', label: 'Semestres', icon: BookMarked },
  { to: '/admin/materias', label: 'Materias', icon: BookOpenCheck },
  { to: '/admin/unidades', label: 'Unidades', icon: FileBadge2 },
  { to: '/admin/temas', label: 'Temas', icon: ListTree },
  { to: '/admin/documentos', label: 'Documentos', icon: ScrollText },
  { to: '/admin/contenido', label: 'Contenido', icon: FilePenLine },
  { to: '/admin/normativa', label: 'Normativa', icon: Scale },
  { to: '/admin/lecturas', label: 'Lecturas', icon: BookMarked },
  { to: '/admin/preguntas', label: 'Preguntas', icon: FileQuestion },
  { to: '/admin/simuladores', label: 'Simuladores', icon: ShieldCheck },
  { to: '/admin/analitica', label: 'Analítica', icon: BarChart3 },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/validacion', label: 'Validación v1.0', icon: BadgeCheck },
]

function AdminShell({ title, description, children, actions }) {
  const { profile, isSuperAdmin } = useAuth()

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Scale size={28} />
          <div>
            <strong>Lex Academia</strong>
            <span>Administración</span>
          </div>
        </div>

        <NavLink
          className="admin-dashboard-shortcut"
          to="/dashboard"
        >
          <LayoutDashboard size={18} />
          <span>Volver al Dashboard</span>
        </NavLink>

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
            <LayoutDashboard size={16} />
            Volver al Dashboard
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
