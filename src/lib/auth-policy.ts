import { supabase } from './supabase'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function checkUserInvited(
  email: string,
): Promise<{ invited: boolean; error?: string }> {
  const lookup_email = normalizeEmail(email)
  if (!lookup_email) {
    return { invited: false, error: 'Email is required.' }
  }

  const { data, error } = await supabase.rpc('is_user_invited', { lookup_email })
  if (error) {
    return { invited: false, error: error.message }
  }
  return { invited: data === true }
}

export async function checkMcpAccess(): Promise<{ allowed: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('user_has_mcp_access')
  if (error) {
    return { allowed: false, error: error.message }
  }
  return { allowed: data === true }
}
