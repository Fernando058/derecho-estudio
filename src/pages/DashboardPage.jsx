import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  BarChart3,
  BookOpen,
  FileQuestion,
  FileText,
  GraduationCap,
  LogOut,
  RotateCcw,
  ShieldCheck,
  User,
  Scale,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const STORAGE_KEY = 'derecho-estudio-semester-level'

function getInitialLevel() {
  const saved = Number(window.localStorage.getItem(STORAGE_KEY))
  return [3, 4, 5].includes(saved) ? saved : 4
}

function DashboardPage() {
  const navigate = useNavigate()

  const {
    profile,
    signOut,
    isAdmin,
  } = useAuth()

  const [semesters, setSemesters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedLevel, setSelectedLevel] = useState(getInitialLevel)

  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [subjectError, setSubjectError] = useState('')

  useEffect(() => {
    async function loadAcademicCatalog() {
      setLoadingSubjects(true)
      setSubjectError('')

      const [
        semesterResponse,
        subjectResponse,
      ] = await Promise.all([
        supabase
          .from('semesters')
          .select('id,name,slug,level_number,sort_order')
          .eq('is_published', true)
          .order('sort_order', { ascending: true }),

        supabase
          .from('subjects')
          .select(`
            id,
            semester_id,
            name,
            slug,
            code,
            credits,
            sort_order
          `)
          .eq('is_published', true)
          .order('sort_order', { ascending: true }),
      ])

      const error =
        semesterResponse.error ||
        subjectResponse.error

      if (error) {
        console.error(error)
        setSubjectError(
          'No fue posible cargar el catálogo académico.',
        )
      } else {
        setSemesters(semesterResponse.data ?? [])
        setSubjects(subjectResponse.data ?? [])

        const levels = new Set(
          (semesterResponse.data ?? []).map(
            (semester) => Number(semester.level_number),
          ),
        )

        if (!levels.has(selectedLevel)) {
          const preferred =
            levels.has(4)
              ? 4
              : Number(semesterResponse.data?.[0]?.level_number)

          if (preferred) {
            setSelectedLevel(preferred)
          }
        }
      }

      setLoadingSubjects(false)
    }

    void loadAcademicCatalog()
  }, [selectedLevel])

  const selectedSemester = useMemo(
    () =>
      semesters.find(
        (semester) =>
          Number(semester.level_number) === selectedLevel,
      ) ?? null,
    [selectedLevel, semesters],
  )

  const visibleSubjects = useMemo(
    () => {
      if (!selectedSemester) return []

      return subjects.filter(
        (subject) =>
          subject.semester_id === selectedSemester.id,
      )
    },
    [selectedSemester, subjects],
  )

  function handleSemesterChange(event) {
    const level = Number(event.target.value)

    setSelectedLevel(level)
    window.localStorage.setItem(
      STORAGE_KEY,
      String(level),
    )
  }

  async function handleLogout() {
    const { error } = await signOut()

    if (error) {
      console.error(error)
      return
    }

    navigate('/', { replace: true })
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
            {profile?.full_name || 'Estudiante'}
          </h1>

          <p>
            Selecciona el semestre para estudiar sus materias,
            unidades, documentos y simuladores.
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

          <Link
            to="/acerca"
            className="button-secondary"
          >
            <Scale size={18} />
            Acerca de
          </Link>

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

      <section className="semester-selector-card">
        <div>
          <GraduationCap size={28} />
          <div>
            <span>Semestre activo</span>
            <strong>
              {selectedSemester?.name || 'Seleccionar semestre'}
            </strong>
          </div>
        </div>

        <label>
          <span>Mostrar materias de</span>
          <select
            value={selectedLevel}
            onChange={handleSemesterChange}
            disabled={loadingSubjects}
          >
            {semesters.map((semester) => (
              <option
                key={semester.id}
                value={semester.level_number}
              >
                {semester.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <User size={30} />

          <h2>Perfil</h2>
          <p>{profile?.email}</p>

          <span className="status-badge">
            {profile?.role || 'student'}
          </span>

          <div style={{ marginTop: '14px' }}>
            <Link className="text-link" to="/perfil">
              Administrar perfil →
            </Link>
          </div>
        </article>

        <article className="dashboard-card">
          <GraduationCap size={30} />

          <h2>Semestre</h2>
          <p>{selectedSemester?.name || '—'}</p>
        </article>

        <article className="dashboard-card">
          <BookOpen size={30} />

          <h2>Materias</h2>
          <p>
            {visibleSubjects.length}
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

        <article className="dashboard-card">
          <FileQuestion size={30} />

          <h2>Mis intentos</h2>
          <p>Resultados, simuladores en curso y evolución.</p>

          <Link className="text-link" to="/intentos">
            Ver historial →
          </Link>
        </article>

        <article className="dashboard-card">
          <BarChart3 size={30} />

          <h2>Mi progreso</h2>
          <p>Precisión, dominio, fortalezas y temas a reforzar.</p>

          <Link className="text-link" to="/progreso">
            Ver analítica →
          </Link>
        </article>

        <article className="dashboard-card">
          <RotateCcw size={30} />

          <h2>Practicar errores</h2>
          <p>Refuerzo personalizado con preguntas que aún no dominas.</p>

          <Link className="text-link" to="/practicar-errores">
            Iniciar refuerzo →
          </Link>
        </article>

        <article className="dashboard-card">
          <Scale size={30} />

          <h2>Acerca de</h2>
          <p>Conoce el propósito de la plataforma y a sus colaboradores.</p>

          <Link className="text-link" to="/acerca">
            Ver información →
          </Link>
        </article>
      </section>

      <section
        className="feature-card"
        style={{ marginTop: '28px' }}
      >
        <div className="subject-section-heading">
          <div>
            <p className="eyebrow">
              {selectedSemester?.name || 'Semestre'}
            </p>
            <h2>Mis materias</h2>
          </div>

          <span className="status-badge">
            {visibleSubjects.length} materias
          </span>
        </div>

        {loadingSubjects && (
          <p>Cargando materias...</p>
        )}

        {subjectError && (
          <div className="auth-message auth-error">
            {subjectError}
          </div>
        )}

        {!loadingSubjects &&
          !subjectError &&
          visibleSubjects.length === 0 && (
            <p>
              No hay materias publicadas para este semestre.
            </p>
          )}

        {!loadingSubjects &&
          !subjectError &&
          visibleSubjects.length > 0 && (
            <div className="subject-list">
              {visibleSubjects.map(
                (subject) => (
                  <article
                    className="subject-row"
                    key={subject.id}
                  >
                    <div>
                      <strong>{subject.name}</strong>

                      <p>
                        {subject.code || 'SIN CÓDIGO'}
                        {subject.credits != null
                          ? ` · ${subject.credits} créditos`
                          : ' · créditos pendientes'}
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

      <div style={{ marginTop: '24px' }}>
        <Link to="/" className="back-link">
          ← Inicio
        </Link>
      </div>
    </main>
  )
}

export default DashboardPage
