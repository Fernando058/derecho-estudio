import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileQuestion,
  LoaderCircle,
  RotateCcw,
  Scale,
  Target,
  XCircle,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getQuizAttemptReview } from '../services/quizService'

function formatDuration(seconds) {
  const value = Number(seconds || 0)
  const minutes = Math.floor(value / 60)
  const rest = value % 60
  return `${minutes} min ${rest} s`
}

function QuizResultPage() {
  const { attemptId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      try {
        setData(await getQuizAttemptReview(attemptId))
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [attemptId])

  const topicPerformance = useMemo(() => {
    const map = new Map()

    for (const question of data?.questions ?? []) {
      const label = question.topic?.title || 'Sin tema asignado'
      const current = map.get(label) || { topic: label, answered: 0, correct: 0 }

      if (question.was_answered) current.answered += 1
      if (question.is_correct) current.correct += 1
      map.set(label, current)
    }

    return [...map.values()]
      .map((item) => ({
        ...item,
        accuracy: item.answered > 0
          ? Math.round((item.correct / item.answered) * 100)
          : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
  }, [data])

  if (loading) {
    return (
      <main className="page">
        <section className="loading-state">
          <LoaderCircle className="spin" size={36} />
          <h2>Calculando resultados...</h2>
        </section>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page">
        <section className="feature-card">
          <h1>Resultados no disponibles</h1>
          <p>{error || 'No se pudo recuperar la revisión.'}</p>
          <Link className="back-link" to="/intentos">← Mis intentos</Link>
        </section>
      </main>
    )
  }

  const { summary, questions } = data
  const subject = summary.subject
  const unit = summary.unit
  const strengths = topicPerformance.filter((item) => item.answered > 0 && item.accuracy >= 80)
  const weaknesses = topicPerformance.filter((item) => item.answered > 0 && item.accuracy < 60)

  return (
    <main className="page quiz-results-page">
      <div className="study-breadcrumbs">
        <Link to="/dashboard">Dashboard</Link>
        <span>›</span>
        <Link to="/intentos">Mis intentos</Link>
        <span>›</span>
        <strong>Resultados</strong>
      </div>

      <section className="quiz-result-hero">
        <div>
          <p className="eyebrow">
            {summary.mode === 'practice' ? 'Modo práctica' : 'Modo examen'}
          </p>
          <h1>{subject.name}</h1>
          <p>
            {summary.quiz_type === 'practice_errors'
              ? 'Refuerzo personalizado de errores'
              : unit
                ? `Unidad ${unit.unit_number} · ${unit.title}`
                : 'Simulador final de la materia'}
          </p>
        </div>

        <div className="quiz-score-ring">
          <strong>{Number(summary.score || 0).toFixed(2)}%</strong>
          <span>calificación</span>
        </div>
      </section>

      <section className="quiz-result-stats">
        <article>
          <CheckCircle2 size={24} />
          <strong>{summary.correct_answers}</strong>
          <span>Correctas</span>
        </article>
        <article>
          <XCircle size={24} />
          <strong>{summary.incorrect_answers}</strong>
          <span>Incorrectas</span>
        </article>
        <article>
          <FileQuestion size={24} />
          <strong>{summary.unanswered}</strong>
          <span>Sin responder</span>
        </article>
        <article>
          <Clock3 size={24} />
          <strong>{formatDuration(summary.duration_seconds)}</strong>
          <span>Tiempo</span>
        </article>
      </section>

      <section className="quiz-analysis-grid">
        <article className="study-section">
          <div className="study-section-heading">
            <Target size={24} />
            <div>
              <h2>Temas a reforzar</h2>
              <p>Temas con menos de 60% de aciertos en este intento.</p>
            </div>
          </div>

          {weaknesses.length === 0 ? (
            <div className="study-empty-inline">No se detectaron temas críticos en este intento.</div>
          ) : (
            <div className="quiz-topic-performance-list">
              {weaknesses.map((item) => (
                <div key={item.topic}>
                  <strong>{item.topic}</strong>
                  <span>{item.correct}/{item.answered} · {item.accuracy}%</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="study-section">
          <div className="study-section-heading">
            <BarChart3 size={24} />
            <div>
              <h2>Fortalezas</h2>
              <p>Temas con al menos 80% de aciertos.</p>
            </div>
          </div>

          {strengths.length === 0 ? (
            <div className="study-empty-inline">Todavía no hay un tema por encima del umbral de fortaleza.</div>
          ) : (
            <div className="quiz-topic-performance-list">
              {strengths.map((item) => (
                <div key={item.topic}>
                  <strong>{item.topic}</strong>
                  <span>{item.correct}/{item.answered} · {item.accuracy}%</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="study-section">
        <div className="study-section-heading">
          <RotateCcw size={24} />
          <div>
            <h2>Revisión pregunta por pregunta</h2>
            <p>Tu respuesta, clave correcta, explicación, distractores y base jurídica asociada.</p>
          </div>
        </div>

        <div className="quiz-review-list">
          {questions.map((question) => (
            <article
              className={`quiz-review-card${question.is_correct ? ' is-correct' : ' is-incorrect'}`}
              key={question.attempt_question_id}
            >
              <div className="quiz-review-heading">
                <span>Pregunta {question.position}</span>
                <span className={`question-status ${question.is_correct ? 'is-verified' : 'is-inactive'}`}>
                  {question.was_answered
                    ? (question.is_correct ? 'Correcta' : 'Incorrecta')
                    : 'Sin responder'}
                </span>
              </div>

              <h3>{question.question_text}</h3>
              {question.topic?.title && <div className="quiz-topic-chip">Tema: {question.topic.title}</div>}

              <div className="quiz-review-options">
                {question.options.map((option) => (
                  <div
                    className={`${option.is_correct ? ' is-correct' : ''}${option.is_selected && !option.is_correct ? ' is-incorrect' : ''}`}
                    key={option.id}
                  >
                    <span className="quiz-option-key">{option.key}</span>
                    <div>
                      <strong>{option.text}</strong>
                      <small>{option.feedback || 'Sin explicación específica.'}</small>
                    </div>
                    {option.is_correct && <CheckCircle2 size={19} />}
                    {option.is_selected && !option.is_correct && <XCircle size={19} />}
                  </div>
                ))}
              </div>

              <div className="quiz-correct-explanation">
                <strong>
                  Respuesta correcta: {question.correct_option.key}. {question.correct_option.text}
                </strong>
                <p>{question.correct_explanation || 'Sin explicación general registrada.'}</p>
              </div>

              {question.legal_basis && (
                <div className="quiz-legal-basis">
                  <Scale size={20} />
                  <div>
                    <strong>
                      {question.legal_basis.source_abbreviation || question.legal_basis.source_title}
                      {' · Art. '}{question.legal_basis.article_number}
                    </strong>
                    {question.legal_basis.heading && <span>{question.legal_basis.heading}</span>}
                    {question.legal_basis.explanation && <p>{question.legal_basis.explanation}</p>}
                    {question.legal_basis.official_url && (
                      <a href={question.legal_basis.official_url} rel="noreferrer" target="_blank">
                        Consultar fuente <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {question.source_reference && (
                <p className="quiz-source-reference">
                  <strong>Fuente de la pregunta:</strong> {question.source_reference}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="quiz-result-actions">
        <Link className="button-secondary" to="/intentos">Ver historial</Link>
        <Link className="primary-button" to={`/materias/${subject.slug}`}>
          Volver a {subject.name}
        </Link>
      </div>
    </main>
  )
}

export default QuizResultPage
