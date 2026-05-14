import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate(redirect, { replace: true })
    })
  }, [navigate, redirect])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setStatus('sending')

    const emailRedirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    })

    if (otpError) {
      setError(otpError.message)
      setStatus('error')
      return
    }
    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <main className="card">
        <h1>Check your email</h1>
        <p>
          We sent a magic sign-in link to <strong>{email}</strong>. Open it on this device to
          continue.
        </p>
      </main>
    )
  }

  return (
    <main className="card">
      <h1>Sign in</h1>
      <p>Enter your email and we&apos;ll send you a one-time login link.</p>
      <form onSubmit={handleSubmit} className="stack">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
        />
        <button type="submit" disabled={status === 'sending'} className="btn btn-primary">
          {status === 'sending' ? 'Sending…' : 'Send magic link'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </main>
  )
}
