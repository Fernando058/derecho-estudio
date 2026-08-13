import { supabase } from '../lib/supabase'

export async function updateMyProfile({
  userId,
  fullName,
  avatarUrl,
}) {
  const cleanName = fullName.trim()
  const cleanAvatar = avatarUrl.trim() || null

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: cleanName,
      avatar_url: cleanAvatar,
    })
    .eq('id', userId)
    .select(`
      id,
      email,
      full_name,
      role,
      avatar_url,
      is_active,
      created_at,
      updated_at
    `)
    .single()

  if (error) throw error

  const {
    error: authError,
  } = await supabase.auth.updateUser({
    data: {
      full_name: cleanName,
      avatar_url: cleanAvatar,
    },
  })

  if (authError) {
    console.warn(
      'El perfil se actualizó, pero no fue posible sincronizar metadata de Auth:',
      authError,
    )
  }

  return data
}
