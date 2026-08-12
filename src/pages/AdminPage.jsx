import { Link } from 'react-router-dom'

import {
  BookOpen,
  Database,
  FileQuestion,
  FileText,
  GraduationCap,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

function AdminPage() {
  const {
    profile,
    isSuperAdmin,
  } = useAuth()

  return (
    <main className="page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">
            Administración
          </p>

          <h1>
            Panel administrativo
          </h1>

          <p>
            Gestión académica y de contenidos
            de Derecho Estudio.
          </p>
        </div>

        <span className="admin-badge">
          <ShieldCheck size={18} />

          {isSuperAdmin
            ? 'Superadministrador'
            : 'Administrador'}
        </span>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <GraduationCap size={30} />

          <h2>
            Estructura académica
          </h2>

          <p>
            Semestres, materias,
            unidades y temas.
          </p>
        </article>

        <article className="dashboard-card">
          <BookOpen size={30} />

          <h2>
            Contenido
          </h2>

          <p>
            Análisis, conceptos
            y material académico.
          </p>
        </article>

        <article className="dashboard-card">
          <FileText size={30} />

          <h2>
            Documentos
          </h2>

          <p>
            Compendios y enlaces
            de Google Drive.
          </p>
        </article>

        <article className="dashboard-card">
          <FileQuestion size={30} />

          <h2>
            Preguntas
          </h2>

          <p>
            Banco de preguntas
            y simuladores.
          </p>
        </article>

        <article className="dashboard-card">
          <Users size={30} />

          <h2>
            Usuarios
          </h2>

          <p>
            Estudiantes y
            administradores.
          </p>
        </article>

        <article className="dashboard-card">
          <Database size={30} />

          <h2>
            Analítica
          </h2>

          <p>
            Rendimiento,
            errores y progreso.
          </p>
        </article>
      </section>

      <section
        className="feature-card"
        style={{
          marginTop: '28px',
        }}
      >
        <h2>
          Sesión administrativa
        </h2>

        <p>
          Usuario:
          {' '}
          <strong>
            {profile?.full_name}
          </strong>
        </p>

        <p>
          Correo:
          {' '}
          {profile?.email}
        </p>

        <p>
          Rol:
          {' '}
          <strong>
            {profile?.role}
          </strong>
        </p>
      </section>

      <div
        style={{
          marginTop: '24px',
        }}
      >
        <Link
          to="/dashboard"
          className="back-link"
        >
          ← Volver al dashboard
        </Link>
      </div>
    </main>
  )
}

export default AdminPage