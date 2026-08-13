import { supabase } from '../../lib/supabase'

const PAGE_SIZE = 500
const ID_BATCH_SIZE = 100

function normalizeError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.code === '23503') return 'Existe una relación inválida en la pregunta.'
  if (error.code === '23505') return 'Ya existe un registro con esos datos.'
  if (error.code === '23514') return 'Los datos no cumplen las reglas del banco de preguntas.'
  if (error.code === '42501') return 'No tienes permisos suficientes para administrar preguntas.'
  if (error.code === 'PGRST201') {
    return 'PostgREST encontró una relación ambigua. Actualiza la aplicación al hotfix administrativo más reciente.'
  }
  return error.message || 'No fue posible completar la operación.'
}

async function unwrap(query) {
  const { data, error } = await query

  if (error) {
    throw new Error(normalizeError(error))
  }

  return data ?? []
}

function chunk(values, size = ID_BATCH_SIZE) {
  const result = []

  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size))
  }

  return result
}

async function fetchAllQuestionPages() {
  const rows = []
  let from = 0

  while (true) {
    const to = from + PAGE_SIZE - 1

    const page = await unwrap(
      supabase
        .from('questions')
        .select(`
          *,
          unit:units!questions_unit_id_fkey(
            id,
            unit_number,
            title,
            subject_id,
            subject:subjects!units_subject_id_fkey(
              id,
              name,
              code,
              slug
            )
          ),
          topic:topics!questions_topic_id_fkey(
            id,
            title
          ),
          legal_article:legal_articles!questions_legal_article_id_fkey(
            id,
            article_number,
            heading,
            legal_source:legal_sources!legal_articles_legal_source_id_fkey(
              id,
              title,
              abbreviation
            )
          )
        `)
        .order('created_at', { ascending: false })
        .range(from, to),
    )

    rows.push(...page)

    if (page.length < PAGE_SIZE) {
      break
    }

    from += PAGE_SIZE
  }

  return rows
}

async function fetchByQuestionIds(table, select, questionIds, orderColumn = null) {
  const rows = []

  for (const ids of chunk(questionIds)) {
    let query = supabase
      .from(table)
      .select(select)
      .in('question_id', ids)

    if (orderColumn) {
      query = query.order(orderColumn, { ascending: true })
    }

    rows.push(...await unwrap(query))
  }

  return rows
}

async function fetchFeedbackByOptionIds(optionIds) {
  const rows = []

  for (const ids of chunk(optionIds, 150)) {
    rows.push(
      ...await unwrap(
        supabase
          .from('question_option_feedback')
          .select('option_id,explanation')
          .in('option_id', ids),
      ),
    )
  }

  return rows
}

export async function listQuestionsAdmin() {
  const questions = await fetchAllQuestionPages()

  if (!questions.length) {
    return []
  }

  const questionIds = questions.map((question) => question.id)

  /*
    No se envían miles de UUID dentro de un único .in().
    Con bancos grandes esa URL supera los límites de PostgREST/proxy
    y responde 400 Bad Request. Los IDs se consultan en lotes pequeños.
  */
  const [
    options,
    answers,
  ] = await Promise.all([
    fetchByQuestionIds(
      'question_options',
      'id,question_id,option_key,option_text,sort_order',
      questionIds,
      'sort_order',
    ),
    fetchByQuestionIds(
      'question_answers',
      'question_id,correct_option_id,correct_explanation',
      questionIds,
    ),
  ])

  const optionIds = options.map((option) => option.id)
  const feedbackRows = optionIds.length
    ? await fetchFeedbackByOptionIds(optionIds)
    : []

  const feedbackByOptionId = new Map(
    feedbackRows.map((row) => [
      row.option_id,
      row.explanation,
    ]),
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
    answers.map((answer) => [
      answer.question_id,
      answer,
    ]),
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

  if (error) {
    throw new Error(normalizeError(error))
  }

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
  if (!unitIds?.length) {
    return new Map()
  }

  const rows = []

  for (const ids of chunk(unitIds, 100)) {
    rows.push(
      ...await unwrap(
        supabase
          .from('questions')
          .select('unit_id,is_active,is_verified')
          .in('unit_id', ids),
      ),
    )
  }

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

    if (
      row.is_active &&
      row.is_verified
    ) {
      current.ready += 1
    }

    counts.set(row.unit_id, current)
  }

  return counts
}
