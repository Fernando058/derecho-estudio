import { supabase } from '../../lib/supabase'

function unwrapSingle(data) {
  if (Array.isArray(data)) return data[0] ?? null
  return data ?? null
}

export async function loadReleaseReadiness(levelNumber = 4) {
  const [
    summaryResponse,
    subjectsResponse,
    unitsResponse,
    datasetsResponse,
  ] = await Promise.all([
    supabase.rpc(
      'admin_release_summary',
      { p_level_number: levelNumber },
    ),
    supabase.rpc(
      'admin_subject_readiness',
      { p_level_number: levelNumber },
    ),
    supabase.rpc(
      'admin_unit_readiness',
      { p_level_number: levelNumber },
    ),
    supabase
      .from('academic_dataset_versions')
      .select(`
        id,
        dataset_key,
        version_label,
        description,
        source_basis,
        checksum,
        applied_at,
        created_at
      `)
      .order('applied_at', { ascending: false }),
  ])

  const error =
    summaryResponse.error ||
    subjectsResponse.error ||
    unitsResponse.error ||
    datasetsResponse.error

  if (error) throw error

  return {
    summary: unwrapSingle(summaryResponse.data),
    subjects: subjectsResponse.data ?? [],
    units: unitsResponse.data ?? [],
    datasets: datasetsResponse.data ?? [],
  }
}

export function buildReadinessExport(data, levelNumber = 4) {
  return {
    generated_at: new Date().toISOString(),
    target: `Lex Academia - semestre ${levelNumber}`,
    summary: data.summary,
    subjects: data.subjects,
    units: data.units,
    datasets: data.datasets,
  }
}
