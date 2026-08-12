import { supabase } from '../../lib/supabase'

function normalizeError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.code === '23503') return 'Existe una relación inválida en la pregunta.'
  if (error.code === '23505') return 'Ya existe un registro con esos datos.'
  if (error.code === '23514') return 'Los datos no cumplen las reglas del banco de preguntas.'
  if (error.code === '42501') return 'No tienes permisos suficientes para administrar preguntas.'
  return error.message || 'No fue posible completar la operación.'
}

async function unwrap(query) {
  const { data, error } = await query
  if (error) throw new Error(normalizeError(error))
  return data
}

export async function listQuestionsAdmin() {
  const questions = await unwrap(
    supabase
      .from('questions')
      .select(`
        *,
        unit:units(
          id,
          unit_number,
          title,
          subject_id,
          subject:subjects(id,name,code,slug)
        ),
        topic:topics(id,title),
        legal_article:legal_articles(
          id,
          article_number,
          heading,
          legal_source:legal_sources(id,title,abbreviation)
        )
      `)
      .order('created_at', { ascending: false }),
  )

  if (!questions.length) return []

  const questionIds = questions.map((question) => question.id)

  const options = await unwrap(
    supabase
      .from('question_options')
      .select('id,question_id,option_key,option_text,sort_order')
      .in('question_id', questionIds)
      .order('sort_order', { ascending: true }),
  )

  const answers = await unwrap(
    supabase
      .from('question_answers')
      .select('question_id,correct_option_id,correct_explanation')
      .in('question_id', questionIds),
  )

  const optionIds = options.map((option) => option.id)
  const feedbackRows = optionIds.length
    ? await unwrap(
        supabase
          .from('question_option_feedback')
          .select('option_id,explanation')
          .in('option_id', optionIds),
      )
    : []

  const feedbackByOptionId = new Map(
    feedbackRows.map((row) => [row.option_id, row.explanation]),
  )

  const optionsByQuestionId = new Map()
  for (const option of options) {
    if (!optionsByQuestionId.has(option.question_id)) {
      optionsByQuestionId.set(option.question_id, [])
    }
    optionsByQuestionId.get(option.question_id).push({
      ...option,
      feedback: feedbackByOptionId.get(option.id) || '',
    })
  }

  const answerByQuestionId = new Map(
    answers.map((answer) => [answer.question_id, answer]),
  )

  return questions.map((question) => ({
    ...question,
    options: optionsByQuestionId.get(question.id) || [],
    answer: answerByQuestionId.get(question.id) || null,
  }))
}

export async function saveQuestion(payload) {
  const { data, error } = await supabase.rpc('admin_save_question', {
    p_question_id: payload.id || null,
    p_unit_id: payload.unit_id,
    p_topic_id: payload.topic_id || null,
    p_legal_article_id: payload.legal_article_id || null,
    p_question_text: payload.question_text,
    p_question_type: payload.question_type,
    p_difficulty: payload.difficulty,
    p_source_reference: payload.source_reference || null,
    p_is_active: Boolean(payload.is_active),
    p_is_verified: Boolean(payload.is_verified),
    p_correct_explanation: payload.correct_explanation,
    p_options: payload.options,
  })

  if (error) throw new Error(normalizeError(error))
  return data
}

export function deleteQuestion(id) {
  return unwrap(
    supabase
      .from('questions')
      .delete()
      .eq('id', id),
  )
}

export async function countQuestionsByUnit(unitIds) {
  if (!unitIds?.length) return new Map()

  const rows = await unwrap(
    supabase
      .from('questions')
      .select('unit_id,is_active,is_verified')
      .in('unit_id', unitIds),
  )

  const counts = new Map()

  for (const row of rows) {
    const current = counts.get(row.unit_id) || {
      total: 0,
      active: 0,
      verified: 0,
      ready: 0,
    }

    current.total += 1
    if (row.is_active) current.active += 1
    if (row.is_verified) current.verified += 1
    if (row.is_active && row.is_verified) current.ready += 1

    counts.set(row.unit_id, current)
  }

  return counts
}
