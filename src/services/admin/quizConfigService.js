import { supabase } from '../../lib/supabase'

function fail(error, fallback) {
  if (!error) return

  if (error.code === 'PGRST201') {
    throw new Error(
      'La consulta de simuladores encontró relaciones ambiguas. El hotfix v1.0.7 usa las claves foráneas explícitas para resolverlas.',
    )
  }

  throw new Error(error.message || fallback)
}

export async function listQuizConfigs() {
  /*
    Existen dos caminos entre quiz_configs y units:
      1) quiz_configs.unit_id
      2) quiz_configs -> quiz_unit_distribution -> units

    PostgREST no puede decidir por sí solo qué relación usar. Por eso
    se indican explícitamente los nombres de las claves foráneas.
  */
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
      subject:subjects!quiz_configs_subject_id_fkey(
        id,
        name,
        slug,
        code
      ),
      unit:units!quiz_configs_unit_id_fkey(
        id,
        unit_number,
        title,
        slug
      ),
      distribution:quiz_unit_distribution!quiz_unit_distribution_quiz_config_id_fkey(
        unit_id,
        question_count,
        unit:units!quiz_unit_distribution_unit_id_fkey(
          id,
          unit_number,
          title
        )
      )
    `)
    .order('quiz_type', { ascending: true })

  fail(
    error,
    'No fue posible cargar las configuraciones de simuladores.',
  )

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
  const { data, error } = await supabase.rpc(
    'admin_update_quiz_config',
    {
      p_quiz_config_id: id,
      p_time_limit_minutes: timeLimitMinutes,
      p_randomize_questions: randomizeQuestions,
      p_randomize_options: randomizeOptions,
      p_is_active: isActive,
      p_distribution: distribution ?? null,
    },
  )

  fail(
    error,
    'No fue posible guardar la configuración del simulador.',
  )

  return data
}

export async function getAdminAnalyticsDashboard() {
  const { data, error } = await supabase.rpc(
    'admin_get_analytics_dashboard',
  )

  fail(
    error,
    'No fue posible cargar la analítica administrativa.',
  )

  return data
}
