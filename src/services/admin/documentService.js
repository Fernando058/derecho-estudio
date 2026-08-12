import { supabase } from '../../lib/supabase'

function normalizeError(error) {
  if (!error) return 'Ocurrió un error inesperado.'

  if (error.code === '23505') {
    return 'Ya existe un registro con esos datos únicos.'
  }

  if (error.code === '23503') {
    return 'No se puede completar la operación porque el registro está relacionado con otros datos.'
  }

  if (error.code === '23514') {
    return 'Los datos no cumplen una de las reglas de validación definidas para documentos.'
  }

  if (error.code === '42501') {
    return 'No tienes permisos suficientes para realizar esta operación.'
  }

  return error.message || 'No fue posible completar la operación.'
}

async function unwrap(query) {
  const { data, error } = await query

  if (error) {
    throw new Error(normalizeError(error))
  }

  return data
}

export function listDocumentsAdmin() {
  return unwrap(
    supabase
      .from('documents')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
  )
}

export function createDocument(payload) {
  return unwrap(
    supabase
      .from('documents')
      .insert(payload)
      .select()
      .single(),
  )
}

export function updateDocument(id, payload) {
  return unwrap(
    supabase
      .from('documents')
      .update(payload)
      .eq('id', id)
      .select()
      .single(),
  )
}

export function deleteDocument(id) {
  return unwrap(
    supabase
      .from('documents')
      .delete()
      .eq('id', id),
  )
}
