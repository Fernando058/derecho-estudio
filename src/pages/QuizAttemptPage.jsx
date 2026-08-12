import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileQuestion,
  Flag,
  LoaderCircle,
  LogOut,
  Save,
  XCircle,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  abandonQuizAttempt,
  finishQuizAttempt,
  getQuizAttempt,
  submitQuizAnswer,
} from '../services/quizService'

function formatClock(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function QuizAttemptPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [practiceFeedback, setPracticeFeedback] = useState({})
  const [remainingSeconds, setRemainingSeconds] = useState(null)

  const questionStartedAtRef = useRef(Date.now())
  const autoFinishRef = useRef(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      try {
        const result = await getQuizAttempt(attemptId)

        if (result?.attempt?.status === 'completed') {
          navigate(`/simuladores/intentos/${attemptId}/resultados`, { replace: true })
          return
        }

        setData(result)

        const firstPending = (result?.questions ?? []).findIndex(
          (question) => !question.selected_option_id,
        )
        setCurrentIndex(firstPending >= 0 ? firstPending : 0)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [attemptId, navigate])

  const currentQuestion = data?.questions?.[currentIndex] ?? null

  useEffect(() => {
    questionStartedAtRef.current = Date.now()
    setSelectedOptionId(currentQuestion?.selected_option_id || '')
  }, [currentIndex, currentQuestion?.attempt_question_id, currentQuestion?.selected_option_id])

  useEffect(() => {
    const attempt = data?.attempt
    if (!attempt?.time_limit_minutes || attempt.status !== 'in_progress') {
      setRemainingSeconds(null)
      return undefined
    }

    const deadline = new Date(attempt.started_at).getTime()
      + attempt.time_limit_minutes * 60 * 1000

    function tick() {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemainingSeconds(seconds)

      if (seconds === 0 && !autoFinishRef.current) {
        autoFinishRef.current = true
        void handleFinish(false)
      }
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [data?.attempt?.id, data?.attempt?.started_at, data?.attempt?.status, data?.attempt?.time_limit_minutes])

  const answeredCount = useMemo(
    () => (data?.questions ?? []).filter((question) => question.selected_option_id).length,
    [data],
  )

  const feedback = currentQuestion
    ? practiceFeedback[currentQuestion.attempt_question_id]
    : null

  async function handleSaveAnswer() {
    if (!currentQuestion || !selectedOptionId || currentQuestion.selected_option_id || saving) return

    setSaving(true)
    setError('')

    try {
      const responseTimeSeconds = Math.max(
        0,
        Math.round((Date.now() - questionStartedAtRef.current) / 1000),
      )

      const result = await submitQuizAnswer({
        attemptId,
        attemptQuestionId: currentQuestion.attempt_question_id,
        selectedOptionId,
        responseTimeSeconds,
      })

      setData((previous) => ({
        ...previous,
        questions: previous.questions.map((question) => (
          question.attempt_question_id === currentQuestion.attempt_question_id
            ? {
                ...question,
                selected_option_id: selectedOptionId,
                answered_at: new Date().toISOString(),
              }
            : question
        )),
      }))

      if (data.attempt.mode === 'practice' && result?.is_correct !== undefined) {
        setPracticeFeedback((previous) => ({
          ...previous,
          [currentQuestion.attempt_question_id]: result,
        }))
      }
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleFinish(askConfirmation = true) {
    if (finishing) return

    if (askConfirmation) {
      const confirmed = window.confirm(
        `Has respondido ${answeredCount} de ${data?.attempt?.total_questions ?? 0} preguntas. ¿Deseas finalizar el intento?`,
      )
      if (!confirmed) return
    }

    setFinishing(true)
    setError('')

    try {
      await finishQuizAttempt(attemptId)
      navigate(`/simuladores/intentos/${attemptId}/resultados`, { replace: true })
    } catch (finishError) {
      setError(finishError.message)
      autoFinishRef.current = false
    } finally {
      setFinishing(false)
    }
  }

  async function handleAbandon() {
    const confirmed = window.confirm(
      '¿Deseas abandonar este intento? Las respuestas guardadas no se calificarán como un intento completado.',
    )
    if (!confirmed) return

    try {
      await abandonQuizAttempt(attemptId)
      navigate('/intentos', { replace: true })
    } catch (abandonError) {
      setError(abandonError.message)
    }
  }

  if (loading) {
    return (
      <main className="page">
        <section className="loading-state">
          <LoaderCircle className="spin" size={36} />
          <h2>Preparando simulador...</h2>
        </section>
      </main>
    )
  }

  if (error && !data) {
    return (
      <main className="page">
        <section className="feature-card">
          <AlertTriangle size={40} />
          <h1>No fue posible abrir el simulador</h1>
          <p>{error}</p>
          <Link className="back-link" to="/dashboard">← Volver al dashboard</Link>
        </section>
      </main>
    )
  }

  if (!data?.attempt || !currentQuestion) {
    return (
      <main className="page">
        <section className="feature-card">
          <h1>Intento sin preguntas</h1>
          <p>No encontramos preguntas asignadas a este intento.</p>
          <Link className="back-link" to="/dashboard">← Volver al dashboard</Link>
        </section>
      </main>
    )
  }

  const { attempt, questions } = data
  const answered = Boolean(currentQuestion.selected_option_id)
  const progress = Math.round((answeredCount / attempt.total_questions) * 100)

  return (
    <main className="quiz-page">
      <header className="quiz-topbar">
        <div>
          <p className="eyebrow">
            {attempt.mode === 'practice' ? 'Modo práctica' : 'Modo examen'}
          </p>
          <h1>
            {attempt.subject.name}
            {attempt.unit ? ` · Unidad ${attempt.unit.unit_number}` : ' · Simulador final'}
          </h1>
        </div>

        <div className="quiz-topbar-actions">
          {remainingSeconds !== null && (
            <span className={`quiz-timer${remainingSeconds <= 300 ? ' is-warning' : ''}`}>
              <Clock3 size={18} /> {formatClock(remainingSeconds)}
            </span>
          )}

          <button className="button-danger" onClick={handleAbandon} type="button">
            <LogOut size={17} /> Abandonar
          </button>
        </div>
      </header>

      <div className="quiz-progress-bar" aria-label={`Progreso ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      {error && <div className="auth-message auth-error quiz-global-message">{error}</div>}

      <div className="quiz-layout">
        <aside className="quiz-sidebar">
          <div className="quiz-sidebar-summary">
            <strong>{answeredCount}/{attempt.total_questions}</strong>
            <span>respondidas</span>
          </div>

          <div className="quiz-question-palette">
            {questions.map((question, index) => (
              <button
                className={`quiz-palette-button${question.selected_option_id ? ' is-answered' : ''}${index === currentIndex ? ' is-current' : ''}`}
                key={question.attempt_question_id}
                onClick={() => setCurrentIndex(index)}
                type="button"
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            className="primary-button quiz-finish-button"
            disabled={finishing}
            onClick={() => handleFinish(true)}
            type="button"
          >
            {finishing ? <LoaderCircle className="spin" size={17} /> : <Flag size={17} />}
            Finalizar intento
          </button>
        </aside>

        <section className="quiz-question-panel">
          <div className="quiz-question-heading">
            <div>
              <span>Pregunta {currentIndex + 1} de {attempt.total_questions}</span>
              <h2>{currentQuestion.question_text}</h2>
            </div>
            <span className="status-badge">{currentQuestion.difficulty}</span>
          </div>

          {currentQuestion.topic && (
            <div className="quiz-topic-chip">Tema: {currentQuestion.topic.title}</div>
          )}

          <div className="quiz-options-list">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptionId === option.id
              const feedbackOption = feedback?.options_feedback?.find(
                (item) => item.id === option.id,
              )

              return (
                <button
                  className={`quiz-option${isSelected ? ' is-selected' : ''}${feedbackOption?.is_correct ? ' is-correct' : ''}${feedback && isSelected && !feedbackOption?.is_correct ? ' is-incorrect' : ''}`}
                  disabled={answered}
                  key={option.id}
                  onClick={() => setSelectedOptionId(option.id)}
                  type="button"
                >
                  <span className="quiz-option-key">{option.key}</span>
                  <span className="quiz-option-copy">
                    <strong>{option.text}</strong>
                    {feedback && feedbackOption?.explanation && (
                      <small>{feedbackOption.explanation}</small>
                    )}
                  </span>
                  {feedbackOption?.is_correct && <CheckCircle2 size={20} />}
                  {feedback && isSelected && !feedbackOption?.is_correct && <XCircle size={20} />}
                </button>
              )
            })}
          </div>

          {!answered && (
            <button
              className="primary-button quiz-save-answer"
              disabled={!selectedOptionId || saving}
              onClick={handleSaveAnswer}
              type="button"
            >
              {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
              Guardar respuesta
            </button>
          )}

          {answered && attempt.mode === 'exam' && (
            <div className="quiz-saved-answer">
              <CheckCircle2 size={19} /> Respuesta guardada. La corrección se mostrará al finalizar.
            </div>
          )}

          {feedback && (
            <div className={`quiz-practice-feedback${feedback.is_correct ? ' is-correct' : ' is-incorrect'}`}>
              <div className="quiz-feedback-title">
                {feedback.is_correct ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                <div>
                  <strong>{feedback.is_correct ? 'Respuesta correcta' : 'Respuesta incorrecta'}</strong>
                  <span>Correcta: {feedback.correct_option?.key}. {feedback.correct_option?.text}</span>
                </div>
              </div>

              {feedback.correct_explanation && <p>{feedback.correct_explanation}</p>}
              {!feedback.is_correct && feedback.selected_feedback && (
                <p><strong>Sobre tu elección:</strong> {feedback.selected_feedback}</p>
              )}
            </div>
          )}

          <div className="quiz-navigation">
            <button
              className="button-secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              type="button"
            >
              <ChevronLeft size={17} /> Anterior
            </button>

            <button
              className="button-secondary"
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
              type="button"
            >
              Siguiente <ChevronRight size={17} />
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default QuizAttemptPage
