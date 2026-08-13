import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  BarChart3,
  BookOpenCheck,
  Brain,
  CircleAlert,
  LoaderCircle,
  RotateCcw,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getLearningDashboard } from '../services/analyticsService'

function formatPercent(value) {
  const numeric = Number(value ?? 0)
  return `${numeric.toFixed(1)}%`
}

function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
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

  const attemptSeries = useMemo(
    () => [...(data?.recent_attempts ?? [])]
      .reverse()
      .map((attempt, index) => ({
        label: `${index + 1}`,
        score: Number(attempt.score ?? 0),
        materia: attempt.subject_code,
      })),
    [data],
  )

  const subjectSeries = useMemo(
    () => (data?.subjects ?? []).map((subject) => ({
      materia: subject.code,
      precision: Number(subject.accuracy ?? 0),
      dominio: Number(subject.progress_percent ?? 0),
    })),
    [data],
  )

  if (loading) {
    return (
      <main className="page">
        <section className="loading-state">
          <LoaderCircle className="spin" size={36} />
          <h2>Calculando tu progreso...</h2>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page">
        <section className="feature-card">
          <CircleAlert size={40} />
          <h1>No fue posible cargar tu progreso</h1>
          <p>{error}</p>
          <Link className="back-link" to="/dashboard">← Volver al dashboard</Link>
        </section>
      </main>
    )
  }

  const summary = data?.summary ?? {}

  return (
    <main className="page analytics-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Analítica personal</p>
          <h1>Mi progreso académico</h1>
          <p>
            Precisión, dominio, fortalezas, debilidades y evolución de tus simuladores.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <Link className="primary-button" to="/practicar-errores">
            <RotateCcw size={18} /> Practicar mis errores
          </Link>
          <Link className="button-secondary" to="/intentos">
            Ver intentos
          </Link>
        </div>
      </section>

      <section className="analytics-summary-grid">
        <article className="analytics-kpi-card">
          <BarChart3 size={26} />
          <strong>{summary.completed_attempts ?? 0}</strong>
          <span>Intentos completados</span>
        </article>
        <article className="analytics-kpi-card">
          <Target size={26} />
          <strong>{formatPercent(summary.accuracy)}</strong>
          <span>Precisión global</span>
        </article>
        <article className="analytics-kpi-card">
          <TrendingUp size={26} />
          <strong>{formatPercent(summary.average_score)}</strong>
          <span>Promedio de calificación</span>
        </article>
        <article className="analytics-kpi-card">
          <BookOpenCheck size={26} />
          <strong>{summary.questions_answered ?? 0}</strong>
          <span>Preguntas respondidas</span>
        </article>
        <article className="analytics-kpi-card">
          <Award size={26} />
          <strong>{summary.mastered_questions ?? 0}</strong>
          <span>Preguntas dominadas</span>
        </article>
        <article className="analytics-kpi-card is-warning">
          <Brain size={26} />
          <strong>{summary.error_questions ?? 0}</strong>
          <span>Pendientes de refuerzo</span>
        </article>
      </section>

      <section className="analytics-grid-two">
        <article className="admin-card analytics-chart-card">
          <div className="admin-card-heading">
            <div>
              <h2>Evolución de calificaciones</h2>
              <p>Últimos intentos completados.</p>
            </div>
          </div>

          {attemptSeries.length > 0 ? (
            <div className="analytics-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attemptSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line dataKey="score" name="Calificación" type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-state-text">Completa simuladores para generar esta gráfica.</p>
          )}
        </article>

        <article className="admin-card analytics-chart-card">
          <div className="admin-card-heading">
            <div>
              <h2>Precisión por materia</h2>
              <p>Comparación de resultados acumulados.</p>
            </div>
          </div>

          <div className="analytics-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="materia" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="precision" name="Precisión" />
                <Bar dataKey="dominio" name="Dominio" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Progreso por materia</h2>
            <p>Tu precisión y dominio acumulado en cada asignatura.</p>
          </div>
        </div>

        <div className="analytics-subject-grid">
          {(data?.subjects ?? []).map((subject) => (
            <article className="analytics-subject-card" key={subject.id}>
              <div className="analytics-subject-title">
                <div>
                  <strong>{subject.name}</strong>
                  <span>{subject.code}</span>
                </div>
                <Link className="text-link" to={`/materias/${subject.slug}`}>Estudiar →</Link>
              </div>

              <div className="analytics-meter-label">
                <span>Precisión</span>
                <strong>{formatPercent(subject.accuracy)}</strong>
              </div>
              <div className="analytics-meter"><span style={{ width: `${Math.min(100, Number(subject.accuracy ?? 0))}%` }} /></div>

              <div className="analytics-meter-label">
                <span>Dominio</span>
                <strong>{formatPercent(subject.progress_percent)}</strong>
              </div>
              <div className="analytics-meter"><span style={{ width: `${Math.min(100, Number(subject.progress_percent ?? 0))}%` }} /></div>

              <div className="analytics-mini-stats">
                <span>{subject.questions_answered ?? 0} respuestas</span>
                <span>{subject.mastered_questions ?? 0} dominadas</span>
                <span>{subject.error_questions ?? 0} por reforzar</span>
              </div>

              <div className="analytics-unit-list">
                {(subject.units ?? []).map((unit) => (
                  <div className="analytics-unit-row" key={unit.id}>
                    <span>Unidad {unit.unit_number}</span>
                    <span>{formatPercent(unit.accuracy)} precisión</span>
                    <strong>{formatPercent(unit.progress_percent)} dominio</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="analytics-grid-two">
        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Fortalezas</h2>
              <p>Temas con mejor nivel de dominio.</p>
            </div>
          </div>

          <div className="analytics-topic-list">
            {(data?.strengths ?? []).length === 0 && <p>Aún no hay datos suficientes.</p>}
            {(data?.strengths ?? []).map((topic) => (
              <div className="analytics-topic-row" key={`strong-${topic.topic_id}`}>
                <div>
                  <strong>{topic.topic_title}</strong>
                  <span>{topic.subject_name} · Unidad {topic.unit_number}</span>
                </div>
                <span className="status-badge">{formatPercent(topic.mastery_score)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Temas a reforzar</h2>
              <p>Prioridad sugerida para tus próximas sesiones.</p>
            </div>
          </div>

          <div className="analytics-topic-list">
            {(data?.weaknesses ?? []).length === 0 && <p>Aún no hay datos suficientes.</p>}
            {(data?.weaknesses ?? []).map((topic) => (
              <div className="analytics-topic-row" key={`weak-${topic.topic_id}`}>
                <div>
                  <strong>{topic.topic_title}</strong>
                  <span>{topic.subject_name} · Unidad {topic.unit_number}</span>
                </div>
                <span className="status-badge">{formatPercent(topic.mastery_score)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <div style={{ marginTop: '24px' }}>
        <Link className="back-link" to="/dashboard">← Volver al dashboard</Link>
      </div>
    </main>
  )
}

export default AnalyticsPage
