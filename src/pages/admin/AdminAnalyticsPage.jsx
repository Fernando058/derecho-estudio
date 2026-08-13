import { useEffect, useState } from 'react'
import {
  BarChart3,
  CircleAlert,
  FileQuestion,
  GraduationCap,
  LoaderCircle,
  Target,
} from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import { getAdminAnalyticsDashboard } from '../../services/admin/quizConfigService'

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`
}

function AdminAnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      try {
        setData(await getAdminAnalyticsDashboard())
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  if (loading) {
    return (
      <AdminShell title="Analítica" description="Indicadores globales de uso y rendimiento.">
        <section className="loading-state">
          <LoaderCircle className="spin" size={34} />
          <h2>Calculando analítica...</h2>
        </section>
      </AdminShell>
    )
  }

  if (error) {
    return (
      <AdminShell title="Analítica" description="Indicadores globales de uso y rendimiento.">
        <div className="auth-message auth-error"><CircleAlert size={18} /> {error}</div>
      </AdminShell>
    )
  }

  const summary = data?.summary ?? {}

  return (
    <AdminShell
      title="Analítica"
      description="Identifica preguntas difíciles, temas con bajo rendimiento y el estado general del banco de evaluación."
    >
      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <GraduationCap size={24} />
          <strong>{summary.students ?? 0}</strong>
          <span>Estudiantes activos</span>
        </article>
        <article className="admin-stat-card">
          <BarChart3 size={24} />
          <strong>{summary.completed_attempts ?? 0}</strong>
          <span>Intentos completados</span>
        </article>
        <article className="admin-stat-card">
          <Target size={24} />
          <strong>{formatPercent(summary.average_score)}</strong>
          <span>Promedio global</span>
        </article>
        <article className="admin-stat-card">
          <FileQuestion size={24} />
          <strong>{summary.ready_questions ?? 0}</strong>
          <span>Preguntas listas</span>
        </article>
      </section>

      <section className="analytics-grid-two">
        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Temas con menor rendimiento</h2>
              <p>Ordenados por precisión observada en intentos completados.</p>
            </div>
          </div>

          <div className="analytics-topic-list">
            {(data?.weak_topics ?? []).length === 0 && <p>Aún no hay respuestas suficientes.</p>}
            {(data?.weak_topics ?? []).map((topic) => (
              <div className="analytics-topic-row" key={topic.topic_id}>
                <div>
                  <strong>{topic.topic_title}</strong>
                  <span>{topic.subject_name} · Unidad {topic.unit_number} · {topic.answers} respuestas</span>
                </div>
                <span className="status-badge">{formatPercent(topic.accuracy)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Preguntas más difíciles</h2>
              <p>Prioridad para revisión editorial del banco.</p>
            </div>
          </div>

          <div className="admin-difficult-list">
            {(data?.difficult_questions ?? []).length === 0 && <p>Aún no hay respuestas suficientes.</p>}
            {(data?.difficult_questions ?? []).map((question) => (
              <div className="admin-difficult-row" key={question.question_id}>
                <div>
                  <strong>{question.question_text}</strong>
                  <span>{question.subject_name} · Unidad {question.unit_number}</span>
                </div>
                <div>
                  <span>{question.incorrect}/{question.answers} incorrectas</span>
                  <strong>{formatPercent(question.accuracy)}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminShell>
  )
}

export default AdminAnalyticsPage
