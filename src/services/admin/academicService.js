import { supabase } from '../../lib/supabase'

function normalizeError(error) {
  if (!error) {
    return 'Ocurrió un error inesperado.'
  }

  if (error.code === '23505') {
    return 'Ya existe un registro con esos datos únicos.'
  }

  if (error.code === '23503') {
    return 'No se puede completar la operación porque el registro está relacionado con otros datos.'
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

export function listSemesters() {
  return unwrap(
    supabase
      .from('semesters')
      .select('*')
      .order('level_number', { ascending: true })
      .order('sort_order', { ascending: true }),
  )
}

export function createSemester(payload) {
  return unwrap(
    supabase
      .from('semesters')
      .insert(payload)
      .select()
      .single(),
  )
}

export function updateSemester(id, payload) {
  return unwrap(
    supabase
      .from('semesters')
      .update(payload)
      .eq('id', id)
      .select()
      .single(),
  )
}

export function deleteSemester(id) {
  return unwrap(
    supabase
      .from('semesters')
      .delete()
      .eq('id', id),
  )
}

export function listSubjects() {
  return unwrap(
    supabase
      .from('subjects')
      .select(`
        *,
        semester:semesters(
          id,
          name,
          level_number
        )
      `)
      .order('sort_order', { ascending: true }),
  )
}

export function createSubject(payload) {
  return unwrap(
    supabase
      .from('subjects')
      .insert(payload)
      .select()
      .single(),
  )
}

export function updateSubject(id, payload) {
  return unwrap(
    supabase
      .from('subjects')
      .update(payload)
      .eq('id', id)
      .select()
      .single(),
  )
}

export function deleteSubject(id) {
  return unwrap(
    supabase
      .from('subjects')
      .delete()
      .eq('id', id),
  )
}

export function listUnits() {
  return unwrap(
    supabase
      .from('units')
      .select(`
        *,
        subject:subjects(
          id,
          name,
          code,
          semester_id,
          semester:semesters(
            id,
            name,
            level_number
          )
        )
      `)
      .order('sort_order', { ascending: true })
      .order('unit_number', { ascending: true }),
  )
}

export function createUnit(payload) {
  return unwrap(
    supabase
      .from('units')
      .insert(payload)
      .select()
      .single(),
  )
}

export function updateUnit(id, payload) {
  return unwrap(
    supabase
      .from('units')
      .update(payload)
      .eq('id', id)
      .select()
      .single(),
  )
}

export function deleteUnit(id) {
  return unwrap(
    supabase
      .from('units')
      .delete()
      .eq('id', id),
  )
}

export function listTopics() {
  return unwrap(
    supabase
      .from('topics')
      .select(`
        *,
        unit:units(
          id,
          unit_number,
          title,
          subject_id,
          subject:subjects(
            id,
            name,
            code
          )
        )
      `)
      .order('sort_order', { ascending: true }),
  )
}

export function createTopic(payload) {
  return unwrap(
    supabase
      .from('topics')
      .insert(payload)
      .select()
      .single(),
  )
}

export function updateTopic(id, payload) {
  return unwrap(
    supabase
      .from('topics')
      .update(payload)
      .eq('id', id)
      .select()
      .single(),
  )
}

export function deleteTopic(id) {
  return unwrap(
    supabase
      .from('topics')
      .delete()
      .eq('id', id),
  )
}
