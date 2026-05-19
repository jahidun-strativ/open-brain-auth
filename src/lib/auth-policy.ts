import { supabase } from './supabase'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export type SignInBlockReason = 'not_invited' | 'no_mcp_access'

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

export async function checkEmailMcpAccess(
  email: string,
): Promise<{ allowed: boolean; error?: string }> {
  const lookup_email = normalizeEmail(email)
  if (!lookup_email) {
    return { allowed: false, error: 'Email is required.' }
  }

  const { data, error } = await supabase.rpc('email_has_mcp_access', { lookup_email })
  if (error) {
    return { allowed: false, error: error.message }
  }
  return { allowed: data === true }
}

export async function checkMcpAccess(): Promise<{ allowed: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('user_has_mcp_access')
  if (error) {
    return { allowed: false, error: error.message }
  }
  return { allowed: data === true }
}

export function signInBlockedMessage(reason: SignInBlockReason): string {
  switch (reason) {
    case 'not_invited':
      return 'This email is not registered. Ask your administrator to invite you before signing in.'
    case 'no_mcp_access':
      return 'This email does not have Open Brain access. Ask your administrator to grant MCP access.'
  }
}

/** Pre-login: invited in auth.users and has at least one mcp_user_projects row. */
export async function checkCanSignInWithEmail(
  email: string,
): Promise<
  | { ok: true }
  | { ok: false; reason: SignInBlockReason; error?: string }
> {
  const lookup_email = normalizeEmail(email)
  if (!lookup_email) {
    return { ok: false, reason: 'not_invited', error: 'Email is required.' }
  }

  const { invited, error: inviteError } = await checkUserInvited(lookup_email)
  if (inviteError) {
    return { ok: false, reason: 'not_invited', error: inviteError }
  }
  if (!invited) {
    return { ok: false, reason: 'not_invited' }
  }

  const { allowed, error: accessError } = await checkEmailMcpAccess(lookup_email)
  if (accessError) {
    return { ok: false, reason: 'no_mcp_access', error: accessError }
  }
  if (!allowed) {
    return { ok: false, reason: 'no_mcp_access' }
  }

  return { ok: true }
}
