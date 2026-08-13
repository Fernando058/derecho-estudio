import { supabase } from '../../lib/supabase'

function fail(error, fallback) {
  if (error) throw new Error(error.message || fallback)
}

export async function listQuizConfigs() {
  const { data, error } = await supabase
    .from('quiz_configs')
    .select(`
      id,
      quiz_type,
      question_count,
      time_limit_minutes,
      randomize_questions,
      randomize_options,
      is_active,
      updated_at,
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
      ),
      distribution:quiz_unit_distribution(
        unit_id,
        question_count,
        unit:units(
          id,
          unit_number,
          title
        )
      )
    `)
    .order('quiz_type', { ascending: true })

  fail(error, 'No fue posible cargar las configuraciones de simuladores.')
  return data ?? []
}

export async function updateQuizConfig({
  id,
  timeLimitMinutes,
  randomizeQuestions,
  randomizeOptions,
  isActive,
  distribution,
}) {
  const { data, error } = await supabase.rpc('admin_update_quiz_config', {
    p_quiz_config_id: id,
    p_time_limit_minutes: timeLimitMinutes,
    p_randomize_questions: randomizeQuestions,
    p_randomize_options: randomizeOptions,
    p_is_active: isActive,
    p_distribution: distribution ?? null,
  })

  fail(error, 'No fue posible guardar la configuración del simulador.')
  return data
}

export async function getAdminAnalyticsDashboard() {
  const { data, error } = await supabase.rpc('admin_get_analytics_dashboard')
  fail(error, 'No fue posible cargar la analítica administrativa.')
  return data
}
