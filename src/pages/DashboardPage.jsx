import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  BookOpen,
  FileText,
  GraduationCap,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

import { useAuth } from '../context/AuthContext'

function DashboardPage() {
  const navigate = useNavigate()

  const {
    profile,
    signOut,
    isAdmin,
  } = useAuth()

  const [subjects, setSubjects] =
    useState([])

  const [loadingSubjects, setLoadingSubjects] =
    useState(true)

  const [subjectError, setSubjectError] =
    useState('')

  useEffect(() => {
    async function loadSubjects() {
      setLoadingSubjects(true)
      setSubjectError('')

      const { data, error } =
        await supabase
          .from('subjects')
          .select(
            `
              id,
              name,
              slug,
              code,
              credits,
              sort_order
            `,
          )
          .eq(
            'is_published',
            true,
          )
          .order(
            'sort_order',
            {
              ascending: true,
            },
          )

      if (error) {
        console.error(error)

        setSubjectError(
          'No fue posible cargar las materias.',
        )
      } else {
        setSubjects(
          data ?? [],
        )
      }

      setLoadingSubjects(false)
    }

    void loadSubjects()
  }, [])

  async function handleLogout() {
    const { error } =
      await signOut()

    if (error) {
      console.error(error)
      return
    }

    navigate(
      '/',
      { replace: true },
    )
  }

  return (
    <main className="page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">
            Mi aprendizaje
          </p>

          <h1>
            Hola,{' '}
            {profile?.full_name ||
              'Estudiante'}
          </h1>

          <p>
            Desde aquí controlaremos tu progreso
            académico y los simuladores.
          </p>
        </div>

        <div className="dashboard-header-actions">
          {isAdmin && (
            <Link
              to="/admin"
              className="button-secondary"
            >
              <ShieldCheck size={18} />
              Administración
            </Link>
          )}

          <button
            type="button"
            className="button-danger"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <User size={30} />

          <h2>Perfil</h2>

          <p>
            {profile?.email}
          </p>

          <span className="status-badge">
            {profile?.role ||
              'student'}
          </span>
        </article>

        <article className="dashboard-card">
          <GraduationCap size={30} />

          <h2>Semestre</h2>

          <p>
            Cuarto semestre
          </p>
        </article>

        <article className="dashboard-card">
          <BookOpen size={30} />

          <h2>Materias</h2>

          <p>
            {subjects.length}
            {' '}
            disponibles
          </p>
        </article>

        <article className="dashboard-card">
          <FileText size={30} />

          <h2>Documentos</h2>

          <p>Compendios y lecturas disponibles.</p>

          <Link className="text-link" to="/documentos">
            Abrir biblioteca →
          </Link>
        </article>
      </section>

      <section
        className="feature-card"
        style={{
          marginTop: '28px',
        }}
      >
        <h2>Mis materias</h2>

        {loadingSubjects && (
          <p>
            Cargando materias...
          </p>
        )}

        {subjectError && (
          <div className="auth-message auth-error">
            {subjectError}
          </div>
        )}

        {!loadingSubjects &&
          !subjectError && (
            <div className="subject-list">
              {subjects.map(
                (subject) => (
                  <article
                    className="subject-row"
                    key={subject.id}
                  >
                    <div>
                      <strong>
                        {subject.name}
                      </strong>

                      <p>
                        {subject.code}
                        {' · '}
                        {subject.credits}
                        {' '}
                        créditos
                      </p>
                    </div>

                    <Link
                      className="button-secondary"
                      to={`/materias/${subject.slug}`}
                    >
                      Estudiar materia →
                    </Link>
                  </article>
                ),
              )}
            </div>
          )}
      </section>

      <div
        style={{
          marginTop: '24px',
        }}
      >
        <Link
          to="/"
          className="back-link"
        >
          ← Inicio
        </Link>
      </div>
    </main>
  )
}

export default DashboardPage