import { supabase } from '../lib/supabase'

function normalizeError(error) {
  return error?.message || 'No fue posible cargar los documentos.'
}

async function unwrap(query) {
  const { data, error } = await query

  if (error) {
    throw new Error(normalizeError(error))
  }

  return data
}

export function listPublishedDocuments() {
  return unwrap(
    supabase
      .from('documents')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
  )
}

export function getPublishedDocument(id) {
  return unwrap(
    supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle(),
  )
}
