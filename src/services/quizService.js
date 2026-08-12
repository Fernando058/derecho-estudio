import { supabase } from '../lib/supabase'

function fail(error, fallback) {
  if (error) throw new Error(error.message || fallback)
}

export async function startQuizAttempt(quizConfigId, mode = 'exam') {
  const { data, error } = await supabase.rpc('start_quiz_attempt', {
    p_quiz_config_id: quizConfigId,
    p_mode: mode,
  })

  fail(error, 'No fue posible iniciar el simulador.')
  return data
}

export async function getQuizAttempt(attemptId) {
  const { data, error } = await supabase.rpc('get_quiz_attempt', {
    p_attempt_id: attemptId,
  })

  fail(error, 'No fue posible cargar el intento.')
  return data
}

export async function submitQuizAnswer({
  attemptId,
  attemptQuestionId,
  selectedOptionId,
  responseTimeSeconds,
}) {
  const { data, error } = await supabase.rpc('submit_quiz_answer', {
    p_attempt_id: attemptId,
    p_attempt_question_id: attemptQuestionId,
    p_selected_option_id: selectedOptionId,
    p_response_time_seconds: responseTimeSeconds ?? null,
  })

  fail(error, 'No fue posible guardar la respuesta.')
  return data
}

export async function finishQuizAttempt(attemptId) {
  const { data, error } = await supabase.rpc('finish_quiz_attempt', {
    p_attempt_id: attemptId,
  })

  fail(error, 'No fue posible finalizar el intento.')
  return data
}

export async function abandonQuizAttempt(attemptId) {
  const { data, error } = await supabase.rpc('abandon_quiz_attempt', {
    p_attempt_id: attemptId,
  })

  fail(error, 'No fue posible abandonar el intento.')
  return data
}

export async function getQuizAttemptReview(attemptId) {
  const { data, error } = await supabase.rpc('get_quiz_attempt_review', {
    p_attempt_id: attemptId,
  })

  fail(error, 'No fue posible cargar la revisión del intento.')
  return data
}

export async function listMyQuizAttempts() {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      quiz_config_id,
      quiz_type,
      mode,
      status,
      total_questions,
      correct_answers,
      incorrect_answers,
      unanswered,
      score,
      duration_seconds,
      started_at,
      completed_at,
      subject:subjects(
        id,
        name,
        slug,
        code
      ),
      unit:units(
        id,
        unit_number,
        title,
        slug
      )
    `)
    .order('started_at', { ascending: false })
    .limit(50)

  fail(error, 'No fue posible cargar el historial de intentos.')
  return data ?? []
}
