import { supabase } from '../../lib/supabase'

function normalizeError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.code === '23503') return 'La relación seleccionada no es válida o todavía tiene datos dependientes.'
  if (error.code === '23505') return 'Ya existe un registro con esos datos.'
  if (error.code === '23514') return 'Los datos no cumplen las reglas de integridad del contenido.'
  if (error.code === '42501') return 'No tienes permisos suficientes para realizar esta operación.'
  return error.message || 'No fue posible completar la operación.'
}

async function unwrap(query) {
  const { data, error } = await query
  if (error) throw new Error(normalizeError(error))
  return data
}

export function listContentBlocksAdmin() {
  return unwrap(
    supabase
      .from('content_blocks')
      .select(`
        *,
        unit:units(
          id,
          unit_number,
          title,
          subject_id,
          subject:subjects(id,name,code)
        ),
        topic:topics(id,title)
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  )
}

export function createContentBlock(payload) {
  return unwrap(
    supabase.from('content_blocks').insert(payload).select().single(),
  )
}

export function updateContentBlock(id, payload) {
  return unwrap(
    supabase.from('content_blocks').update(payload).eq('id', id).select().single(),
  )
}

export function deleteContentBlock(id) {
  return unwrap(
    supabase.from('content_blocks').delete().eq('id', id),
  )
}
