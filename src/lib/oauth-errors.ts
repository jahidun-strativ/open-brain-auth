/** Map Supabase OAuth API errors to user-facing copy. */
export function formatOAuthAuthorizationError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('authorization not found') ||
    lower.includes('no longer pending') ||
    lower.includes('cannot be processed')
  ) {
    return (
      'This authorization request has expired or was already completed. ' +
      'Close this tab, return to Claude (or your app), and add or reconnect the Open Brain connector to start again.'
    )
  }
  return message
}

export function isOAuthConsentRedirect(redirect: string): boolean {
  return redirect.includes('/oauth/consent') && redirect.includes('authorization_id=')
}
