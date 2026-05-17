import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { checkUserInvited, normalizeEmail } from '../lib/auth-policy'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'redirecting' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate(redirect, { replace: true })
    })
  }, [navigate, redirect])

  async function handleGoogleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setStatus('checking')

    const normalized = normalizeEmail(email)
    const { invited, error: inviteError } = await checkUserInvited(normalized)
    if (inviteError) {
      setError(inviteError)
      setStatus('error')
      return
    }
    if (!invited) {
      setError('User does not exist. Contact your administrator.')
      setStatus('error')
      return
    }

    setStatus('redirecting')
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: { login_hint: normalized },
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setStatus('error')
    }
  }

  const busy = status === 'checking' || status === 'redirecting'

  return (
    <main className="card">
      <h1>Sign in</h1>
      <p>Enter the email your administrator invited, then continue with Google.</p>
      <form onSubmit={handleGoogleSignIn} className="stack">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          autoFocus
          disabled={busy}
        />
        <button type="submit" disabled={busy} className="btn btn-primary">
          {status === 'checking'
            ? 'Checking…'
            : status === 'redirecting'
              ? 'Redirecting to Google…'
              : 'Continue with Google'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </main>
  )
}
