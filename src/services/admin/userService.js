import { supabase } from '../../lib/supabase'

export async function listUsersWithStats() {
  const {
    data,
    error,
  } = await supabase.rpc('admin_list_users')

  if (error) throw error
  return data ?? []
}

export async function updateManagedUser({
  userId,
  fullName,
  role,
  isActive,
}) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'admin_update_user',
    {
      p_user_id: userId,
      p_full_name: fullName,
      p_role: role,
      p_is_active: isActive,
    },
  )

  if (error) throw error
  return data
}
