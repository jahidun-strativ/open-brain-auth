import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { checkCanSignInWithEmail, signInBlockedMessage } from '../lib/auth-policy'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const urlError = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'sending' | 'sent'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const displayError = urlError ?? formError

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate(redirect, { replace: true })
    })
  }, [navigate, redirect])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setStatus('checking')

    const gate = await checkCanSignInWithEmail(email)
    if (!gate.ok) {
      setFormError(gate.error ?? signInBlockedMessage(gate.reason))
      setStatus('idle')
      return
    }

    setStatus('sending')
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl,
        shouldCreateUser: false,
      },
    })

    if (otpError) {
      setFormError(otpError.message)
      setStatus('idle')
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <main className="card">
        <h1>Check your inbox</h1>
        <p>
          We sent a sign-in link to <strong>{email.trim()}</strong>. Click the link in your email to
          continue.
        </p>
        <p className="footer">Check spam if nothing arrives within a minute.</p>
      </main>
    )
  }

  return (
    <main className="card">
      <h1>Sign in</h1>
      <p>Enter your work email. You must already be invited and granted Open Brain access.</p>
      <form className="stack" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'checking' || status === 'sending'}
        />
        <button
          type="submit"
          disabled={status === 'checking' || status === 'sending'}
          className="btn btn-primary"
        >
          {status === 'checking'
            ? 'Checking access…'
            : status === 'sending'
              ? 'Sending link…'
              : 'Send magic link'}
        </button>
        {displayError && <p className="error">{displayError}</p>}
      </form>
    </main>
  )
}
