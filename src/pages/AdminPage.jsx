import { Link } from 'react-router-dom'
import {
  BookOpen,
  FileQuestion,
  FileText,
  GraduationCap,
  Layers3,
  ListTree,
  Users,
} from 'lucide-react'
import AdminShell from '../components/admin/AdminShell'

const modules = [
  {
    to: '/admin/semestres',
    title: 'Semestres',
    description: 'Crear, editar, publicar y ordenar niveles académicos.',
    icon: Layers3,
  },
  {
    to: '/admin/materias',
    title: 'Materias',
    description: 'Gestionar las asignaturas vinculadas a cada semestre.',
    icon: BookOpen,
  },
  {
    to: '/admin/unidades',
    title: 'Unidades',
    description: 'Administrar las cuatro unidades de cada materia.',
    icon: GraduationCap,
  },
  {
    to: '/admin/temas',
    title: 'Temas y subtemas',
    description: 'Organizar la estructura temática interna de cada unidad.',
    icon: ListTree,
  },
]

const futureModules = [
  { title: 'Documentos', description: 'Compendios y enlaces de Google Drive.', icon: FileText },
  { title: 'Preguntas', description: 'Banco de preguntas y simuladores.', icon: FileQuestion },
  { title: 'Usuarios', description: 'Estudiantes, administradores y permisos.', icon: Users },
]

function AdminPage() {
  return (
    <AdminShell
      title="Resumen administrativo"
      description="Desde aquí se administra la estructura académica completa de Derecho Estudio."
    >
      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <strong>v0.2</strong>
          <span>Módulo administrativo académico</span>
        </article>
        <article className="admin-stat-card">
          <strong>4</strong>
          <span>Niveles CRUD disponibles</span>
        </article>
        <article className="admin-stat-card">
          <strong>5</strong>
          <span>Materias iniciales cargadas</span>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Estructura académica</h2>
            <p>Estos módulos ya están operativos y conectados con Supabase.</p>
          </div>
        </div>

        <div className="admin-module-grid">
          {modules.map(({ to, title, description, icon: Icon }) => (
            <Link className="admin-module-card" key={to} to={to}>
              <Icon size={28} />
              <h3>{title}</h3>
              <p>{description}</p>
              <span>Administrar →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Próximos módulos</h2>
            <p>Se incorporarán en las siguientes versiones sin rehacer la arquitectura actual.</p>
          </div>
        </div>

        <div className="admin-module-grid">
          {futureModules.map(({ title, description, icon: Icon }) => (
            <article className="admin-module-card is-disabled" key={title}>
              <Icon size={28} />
              <h3>{title}</h3>
              <p>{description}</p>
              <span>Próxima versión</span>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  )
}

export default AdminPage
