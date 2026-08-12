import { supabase } from '../../lib/supabase'

function normalizeError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.code === '23503') return 'No se puede completar la operación porque existen relaciones dependientes.'
  if (error.code === '23505') return 'Esta lectura ya está relacionada con el tema seleccionado.'
  if (error.code === '23514') return 'Los datos no cumplen las reglas definidas para lecturas.'
  if (error.code === '42501') return 'No tienes permisos suficientes para realizar esta operación.'
  return error.message || 'No fue posible completar la operación.'
}

async function unwrap(query) {
  const { data, error } = await query
  if (error) throw new Error(normalizeError(error))
  return data
}

export function listReadingsAdmin() {
  return unwrap(
    supabase.from('readings').select('*').order('created_at', { ascending: false }),
  )
}

export function createReading(payload) {
  return unwrap(supabase.from('readings').insert(payload).select().single())
}

export function updateReading(id, payload) {
  return unwrap(supabase.from('readings').update(payload).eq('id', id).select().single())
}

export function deleteReading(id) {
  return unwrap(supabase.from('readings').delete().eq('id', id))
}

export function listTopicReadingsAdmin() {
  return unwrap(
    supabase
      .from('topic_readings')
      .select(`
        topic_id,
        reading_id,
        relevance,
        sort_order,
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
        reading:readings(id,title,author,reading_type,url)
      `)
      .order('sort_order', { ascending: true }),
  )
}

export function createTopicReading(payload) {
  return unwrap(supabase.from('topic_readings').insert(payload).select().single())
}

export function updateTopicReading(topicId, readingId, payload) {
  return unwrap(
    supabase
      .from('topic_readings')
      .update(payload)
      .eq('topic_id', topicId)
      .eq('reading_id', readingId)
      .select()
      .single(),
  )
}

export function deleteTopicReading(topicId, readingId) {
  return unwrap(
    supabase
      .from('topic_readings')
      .delete()
      .eq('topic_id', topicId)
      .eq('reading_id', readingId),
  )
}
