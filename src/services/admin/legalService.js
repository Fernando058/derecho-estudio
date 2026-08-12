import { supabase } from '../../lib/supabase'

function normalizeError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.code === '23503') return 'No se puede completar la operación porque existen relaciones dependientes.'
  if (error.code === '23505') return 'Ya existe un registro con esos datos únicos.'
  if (error.code === '23514') return 'Los datos no cumplen las reglas definidas para normativa.'
  if (error.code === '42501') return 'No tienes permisos suficientes para realizar esta operación.'
  return error.message || 'No fue posible completar la operación.'
}

async function unwrap(query) {
  const { data, error } = await query
  if (error) throw new Error(normalizeError(error))
  return data
}

export function listLegalSourcesAdmin() {
  return unwrap(
    supabase.from('legal_sources').select('*').order('title', { ascending: true }),
  )
}

export function createLegalSource(payload) {
  return unwrap(supabase.from('legal_sources').insert(payload).select().single())
}

export function updateLegalSource(id, payload) {
  return unwrap(supabase.from('legal_sources').update(payload).eq('id', id).select().single())
}

export function deleteLegalSource(id) {
  return unwrap(supabase.from('legal_sources').delete().eq('id', id))
}

export function listLegalArticlesAdmin() {
  return unwrap(
    supabase
      .from('legal_articles')
      .select(`
        *,
        legal_source:legal_sources(id,title,abbreviation,source_type)
      `)
      .order('created_at', { ascending: false }),
  )
}

export function createLegalArticle(payload) {
  return unwrap(supabase.from('legal_articles').insert(payload).select().single())
}

export function updateLegalArticle(id, payload) {
  return unwrap(supabase.from('legal_articles').update(payload).eq('id', id).select().single())
}

export function deleteLegalArticle(id) {
  return unwrap(supabase.from('legal_articles').delete().eq('id', id))
}

export function listTopicLegalArticlesAdmin() {
  return unwrap(
    supabase
      .from('topic_legal_articles')
      .select(`
        topic_id,
        legal_article_id,
        importance,
        notes,
        topic:topics(
          id,
          title,
          unit_id,
          unit:units(
            id,
            unit_number,
            title,
            subject_id,
            subject:subjects(id,name,code)
          )
        ),
        legal_article:legal_articles(
          id,
          article_number,
          heading,
          legal_source:legal_sources(id,title,abbreviation)
        )
      `),
  )
}

export function createTopicLegalArticle(payload) {
  return unwrap(supabase.from('topic_legal_articles').insert(payload).select().single())
}

export function updateTopicLegalArticle(topicId, articleId, payload) {
  return unwrap(
    supabase
      .from('topic_legal_articles')
      .update(payload)
      .eq('topic_id', topicId)
      .eq('legal_article_id', articleId)
      .select()
      .single(),
  )
}

export function deleteTopicLegalArticle(topicId, articleId) {
  return unwrap(
    supabase
      .from('topic_legal_articles')
      .delete()
      .eq('topic_id', topicId)
      .eq('legal_article_id', articleId),
  )
}
