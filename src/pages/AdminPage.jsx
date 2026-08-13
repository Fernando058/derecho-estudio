import { Link } from 'react-router-dom'
import {
  BarChart3,
  BadgeCheck,
  BookMarked,
  BookOpen,
  FilePenLine,
  FileQuestion,
  FileText,
  GraduationCap,
  Layers3,
  ListTree,
  Scale,
  Settings2,
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
  {
    to: '/admin/documentos',
    title: 'Documentos',
    description: 'Gestionar compendios y recursos enlazados desde Google Drive.',
    icon: FileText,
  },
  {
    to: '/admin/contenido',
    title: 'Contenido académico',
    description: 'Crear análisis, resúmenes, conceptos clave y orientaciones de estudio.',
    icon: FilePenLine,
  },
  {
    to: '/admin/normativa',
    title: 'Normativa',
    description: 'Gestionar fuentes legales, artículos y su relación con cada tema.',
    icon: Scale,
  },
  {
    to: '/admin/lecturas',
    title: 'Lecturas',
    description: 'Administrar bibliografía y lecturas recomendadas por tema.',
    icon: BookMarked,
  },
  {
    to: '/admin/preguntas',
    title: 'Preguntas',
    description: 'Banco de preguntas, respuestas protegidas, feedback e importación masiva.',
    icon: FileQuestion,
  },
  {
    to: '/admin/simuladores',
    title: 'Simuladores',
    description: 'Tiempos, aleatorización, disponibilidad y distribución del examen final.',
    icon: Settings2,
  },
  {
    to: '/admin/analitica',
    title: 'Analítica',
    description: 'Rendimiento global, temas débiles y preguntas con mayor dificultad.',
    icon: BarChart3,
  },
  {
    to: '/admin/usuarios',
    title: 'Usuarios',
    description: 'Gestionar estudiantes, administradores, estado de acceso y permisos.',
    icon: Users,
  },
  {
    to: '/admin/validacion',
    title: 'Validación v1.0',
    description: 'Auditar estructura, contenido, preguntas, simuladores y dataset del cuarto semestre.',
    icon: BadgeCheck,
  },
]

const futureModules = []

function AdminPage() {
  return (
    <AdminShell
      title="Resumen administrativo"
      description="Gestiona la plataforma y verifica la preparación integral del cuarto semestre antes de v1.0."
    >
      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <strong>v0.9</strong>
          <span>Consolidación y validación para v1.0</span>
        </article>
        <article className="admin-stat-card">
          <strong>13</strong>
          <span>Módulos administrativos disponibles</span>
        </article>
        <article className="admin-stat-card">
          <strong>20</strong>
          <span>Unidades iniciales preparadas</span>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Módulos operativos</h2>
            <p>Todos estos módulos están conectados con Supabase y protegidos mediante RLS.</p>
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

      {futureModules.length > 0 && (
        <section className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Próximos módulos</h2>
              <p>Nuevas funciones administrativas se incorporarán en fases posteriores.</p>
            </div>
          </div>
        </section>
      )}
    </AdminShell>
  )
}

export default AdminPage
