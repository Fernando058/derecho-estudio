import { supabase } from '../lib/supabase'

function fail(error, fallback) {
  if (error) throw new Error(error.message || fallback)
}

export async function getLearningDashboard() {
  const { data, error } = await supabase.rpc('get_learning_dashboard')
  fail(error, 'No fue posible cargar tu analítica de aprendizaje.')
  return data
}

export async function startErrorPractice(subjectId, limit = 20) {
  const { data, error } = await supabase.rpc('start_error_practice', {
    p_subject_id: subjectId,
    p_limit: limit,
  })
  fail(error, 'No fue posible iniciar la práctica de errores.')
  return data
}
