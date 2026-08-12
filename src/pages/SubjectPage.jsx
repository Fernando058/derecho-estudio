import { useEffect, useMemo, useState } from 'react'
import { BookOpen, FileQuestion, FileText, GraduationCap, LoaderCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getSubjectStudyData } from '../services/studyService'

function SubjectPage() {
  const { subjectSlug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      try {
        setData(await getSubjectStudyData(subjectSlug))
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [subjectSlug])

  const documentCountByUnit = useMemo(() => {
    const map = new Map()

    for (const document of data?.documents ?? []) {
      if (!document.unit_id) continue
      map.set(document.unit_id, (map.get(document.unit_id) || 0) + 1)
    }

    return map
  }, [data])

  if (loading) {
    return (
      <main className="page">
        <section className="loading-state">
          <LoaderCircle className="spin" size={36} />
          <h2>Cargando materia...</h2>
        </section>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page">
        <section className="feature-card">
          <h1>Materia no disponible</h1>
          <p>{error || 'No encontramos esta materia publicada.'}</p>
          <Link className="back-link" to="/dashboard">← Volver al dashboard</Link>
        </section>
      </main>
    )
  }

  const { subject, units } = data

  return (
    <main className="page study-page">
      <section className="study-hero">
        <div>
          <p className="eyebrow">{subject.code} · {subject.credits ?? '—'} créditos</p>
          <h1>{subject.name}</h1>
          <p>
            {subject.description ||
              'Estudia la materia por unidades, revisa sus recursos y prepara los simuladores.'}
          </p>
        </div>
        <BookOpen size={52} />
      </section>

      <div className="study-breadcrumbs">
        <Link to="/dashboard">Dashboard</Link>
        <span>›</span>
        <strong>{subject.name}</strong>
      </div>

      <section className="unit-card-grid">
        {units.map((unit) => (
          <article className="unit-study-card" key={unit.id}>
            <div className="unit-study-number">Unidad {unit.unit_number}</div>
            <h2>{unit.title}</h2>
            <p>{unit.summary || unit.learning_outcome || 'Contenido académico disponible para esta unidad.'}</p>

            <div className="unit-study-meta">
              <span><FileText size={16} /> {documentCountByUnit.get(unit.id) || 0} documento(s)</span>
              <span><FileQuestion size={16} /> 30 preguntas</span>
            </div>

            <Link
              className="primary-button"
              to={`/materias/${subject.slug}/unidades/${unit.unit_number}`}
            >
              <GraduationCap size={18} />
              Estudiar unidad
            </Link>
          </article>
        ))}
      </section>

      {units.length === 0 && (
        <section className="documents-empty">
          <GraduationCap size={42} />
          <h2>Unidades todavía no publicadas</h2>
          <p>El administrador aún no ha publicado las unidades de esta materia.</p>
        </section>
      )}

      <section className="study-final-exam">
        <div>
          <p className="eyebrow">Simulador final</p>
          <h2>100 preguntas de las 4 unidades</h2>
          <p>
            La distribución inicial queda preparada en 25 preguntas por unidad.
            El motor de cuestionarios se habilitará en la siguiente fase.
          </p>
        </div>
        <span className="status-badge"><FileQuestion size={16} /> Próxima versión</span>
      </section>
    </main>
  )
}

export default SubjectPage
