import { useState } from 'react'
import { FileQuestion, LoaderCircle, PlayCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { startQuizAttempt } from '../../services/quizService'

function QuizLaunchActions({
  quizConfig,
  ready,
  readyLabel,
  compact = false,
}) {
  const navigate = useNavigate()
  const [startingMode, setStartingMode] = useState('')
  const [error, setError] = useState('')

  if (!quizConfig) {
    return (
      <div className="quiz-launch-unavailable">
        <FileQuestion size={18} />
        Configuración de simulador no disponible.
      </div>
    )
  }

  async function handleStart(mode) {
    if (!ready || startingMode) return

    setStartingMode(mode)
    setError('')

    try {
      const result = await startQuizAttempt(quizConfig.id, mode)
      navigate(`/simuladores/intentos/${result.attempt_id}`)
    } catch (startError) {
      setError(startError.message)
    } finally {
      setStartingMode('')
    }
  }

  return (
    <div className={`quiz-launch${compact ? ' is-compact' : ''}`}>
      <div className="quiz-launch-status">
        <FileQuestion size={18} />
        <span>{readyLabel}</span>
      </div>

      <div className="quiz-launch-buttons">
        <button
          className="primary-button"
          disabled={!ready || Boolean(startingMode)}
          onClick={() => handleStart('exam')}
          type="button"
        >
          {startingMode === 'exam' ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <PlayCircle size={17} />
          )}
          Modo examen
        </button>

        <button
          className="button-secondary"
          disabled={!ready || Boolean(startingMode)}
          onClick={() => handleStart('practice')}
          type="button"
        >
          {startingMode === 'practice' ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <PlayCircle size={17} />
          )}
          Modo práctica
        </button>
      </div>

      {!ready && (
        <p className="quiz-launch-note">
          El simulador se habilitará cuando el banco alcance la cantidad requerida de preguntas activas y verificadas.
        </p>
      )}

      {error && <div className="auth-message auth-error">{error}</div>}
    </div>
  )
}

export default QuizLaunchActions
