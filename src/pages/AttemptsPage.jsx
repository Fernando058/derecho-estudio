import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  FileQuestion,
  LoaderCircle,
  PlayCircle,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { listMyQuizAttempts } from '../services/quizService'

const statusLabels = {
  in_progress: 'En curso',
  completed: 'Completado',
  abandoned: 'Abandonado',
}

function AttemptsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      try {
        setItems(await listMyQuizAttempts())
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <main className="page">
      <div className="study-breadcrumbs">
        <Link to="/dashboard">Dashboard</Link>
        <span>›</span>
        <strong>Mis intentos</strong>
      </div>

      <section className="study-hero">
        <div>
          <p className="eyebrow">Historial de evaluación</p>
          <h1>Mis intentos</h1>
          <p>Consulta simuladores finalizados, resultados y sesiones que todavía están en curso.</p>
        </div>
        <FileQuestion size={52} />
      </section>

      {loading && (
        <section className="loading-state">
          <LoaderCircle className="spin" size={36} />
          <h2>Cargando historial...</h2>
        </section>
      )}

      {error && <div className="auth-message auth-error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <section className="documents-empty">
          <FileQuestion size={42} />
          <h2>Aún no tienes intentos</h2>
          <p>Cuando inicies un simulador aparecerá aquí.</p>
        </section>
      )}

      {!loading && !error && items.length > 0 && (
        <section className="attempt-history-list">
          {items.map((attempt) => (
            <article className="attempt-history-card" key={attempt.id}>
              <div className="attempt-history-main">
                <div className="attempt-history-icon">
                  {attempt.status === 'completed'
                    ? <CheckCircle2 size={24} />
                    : attempt.status === 'abandoned'
                      ? <XCircle size={24} />
                      : <PlayCircle size={24} />}
                </div>

                <div>
                  <span className="eyebrow">
                    {attempt.mode === 'practice' ? 'Práctica' : 'Examen'} · {statusLabels[attempt.status]}
                  </span>
                  <h2>{attempt.subject?.name}</h2>
                  <p>
                    {attempt.unit
                      ? `Unidad ${attempt.unit.unit_number} · ${attempt.unit.title}`
                      : 'Simulador final de la materia'}
                  </p>
                  <small>
                    <Clock3 size={14} /> {new Date(attempt.started_at).toLocaleString()}
                  </small>
                </div>
              </div>

              <div className="attempt-history-result">
                {attempt.status === 'completed' ? (
                  <>
                    <strong>{Number(attempt.score || 0).toFixed(2)}%</strong>
                    <span>{attempt.correct_answers}/{attempt.total_questions} correctas</span>
                    <Link className="button-secondary" to={`/simuladores/intentos/${attempt.id}/resultados`}>
                      Ver resultados
                    </Link>
                  </>
                ) : attempt.status === 'in_progress' ? (
                  <Link className="primary-button" to={`/simuladores/intentos/${attempt.id}`}>
                    Continuar
                  </Link>
                ) : (
                  <span className="status-badge">Sin calificación</span>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default AttemptsPage
