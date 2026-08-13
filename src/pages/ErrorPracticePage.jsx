import { useEffect, useState } from 'react'
import {
  Brain,
  CircleCheck,
  LoaderCircle,
  RotateCcw,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getLearningDashboard,
  startErrorPractice,
} from '../services/analyticsService'

function ErrorPracticePage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      try {
        setData(await getLearningDashboard())
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  async function handleStart(subject) {
    if (!subject.error_questions || startingId) return

    setStartingId(subject.id)
    setError('')

    try {
      const attempt = await startErrorPractice(
        subject.id,
        Math.min(20, Math.max(5, Number(subject.error_questions))),
      )
      navigate(`/simuladores/intentos/${attempt.attempt_id}`)
    } catch (startError) {
      setError(startError.message)
    } finally {
      setStartingId('')
    }
  }

  if (loading) {
    return (
      <main className="page">
        <section className="loading-state">
          <LoaderCircle className="spin" size={36} />
          <h2>Buscando preguntas para reforzar...</h2>
        </section>
      </main>
    )
  }

  return (
    <main className="page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Refuerzo personalizado</p>
          <h1>Practicar mis errores</h1>
          <p>
            Las preguntas permanecen aquí hasta que alcances un dominio suficiente mediante respuestas correctas repetidas.
          </p>
        </div>

        <Link className="button-secondary" to="/progreso">
          Ver mi progreso
        </Link>
      </section>

      {error && <div className="auth-message auth-error" style={{ marginTop: '24px' }}>{error}</div>}

      <section className="error-practice-grid">
        {(data?.subjects ?? []).map((subject) => {
          const pending = Number(subject.error_questions ?? 0)
          const mastered = Number(subject.mastered_questions ?? 0)
          const isStarting = startingId === subject.id

          return (
            <article className="error-practice-card" key={subject.id}>
              <div className="error-practice-icon">
                {pending > 0 ? <Brain size={30} /> : <CircleCheck size={30} />}
              </div>

              <div>
                <span className="eyebrow">{subject.code}</span>
                <h2>{subject.name}</h2>
              </div>

              <div className="error-practice-stats">
                <span><strong>{pending}</strong> pendientes</span>
                <span><strong>{mastered}</strong> dominadas</span>
              </div>

              <p>
                {pending > 0
                  ? `Se seleccionarán hasta ${Math.min(20, Math.max(5, pending))} preguntas de tu historial de errores.`
                  : 'No tienes preguntas pendientes de refuerzo en esta materia.'}
              </p>

              <button
                className={pending > 0 ? 'primary-button' : 'button-secondary'}
                disabled={pending === 0 || Boolean(startingId)}
                onClick={() => handleStart(subject)}
                type="button"
              >
                {isStarting
                  ? <LoaderCircle className="spin" size={18} />
                  : <RotateCcw size={18} />}
                {pending > 0 ? 'Iniciar refuerzo' : 'Sin errores pendientes'}
              </button>
            </article>
          )
        })}
      </section>

      <div style={{ marginTop: '24px' }}>
        <Link className="back-link" to="/dashboard">← Volver al dashboard</Link>
      </div>
    </main>
  )
}

export default ErrorPracticePage
