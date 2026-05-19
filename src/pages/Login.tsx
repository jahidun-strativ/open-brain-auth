import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { checkCanSignInWithEmail, signInBlockedMessage } from '../lib/auth-policy'
import { isOAuthConsentRedirect } from '../lib/oauth-errors'
import { supabase } from '../lib/supabase'

function mapPasswordSignInError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Invalid email or password.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email first, or ask your administrator to mark the account as confirmed.'
  }
  return message
}

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const urlError = searchParams.get('error')
  const oauthFlow = isOAuthConsentRedirect(redirect)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'signing-in'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const displayError = urlError ?? formError

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(redirect, { replace: true })
    })
  }, [navigate, redirect])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setStatus('checking')

    const gate = await checkCanSignInWithEmail(email)
    if (gate.ok === false) {
      setFormError(gate.error ?? signInBlockedMessage(gate.reason))
      setStatus('idle')
      return
    }

    setStatus('signing-in')
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setFormError(mapPasswordSignInError(signInError.message))
      setStatus('idle')
      return
    }

    navigate(redirect, { replace: true })
  }

  return (
    <main className="card">
      <h1>Sign in</h1>
      <p>
        Use the email and password your administrator set for you. You must already have Open Brain
        access.
      </p>
      {oauthFlow && (
        <p className="footer" style={{ textAlign: 'left', marginBottom: 12 }}>
          Connecting an app? Sign in now — the authorization request expires after a short time.
        </p>
      )}
      <form className="stack" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status !== 'idle'}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={status !== 'idle'}
        />
        <button
          type="submit"
          disabled={status !== 'idle'}
          className="btn btn-primary"
        >
          {status === 'checking'
            ? 'Checking access…'
            : status === 'signing-in'
              ? 'Signing in…'
              : 'Sign in'}
        </button>
        {displayError && <p className="error">{displayError}</p>}
      </form>
      <p className="footer">
        No account? Ask your administrator to create a user and set a password in Supabase Auth.
      </p>
    </main>
  )
}
