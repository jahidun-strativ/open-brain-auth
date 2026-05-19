import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const urlError = searchParams.get('error')
  const [status, setStatus] = useState<'idle' | 'redirecting'>('idle')
  const [oauthError, setOauthError] = useState<string | null>(null)
  const displayError = urlError ?? oauthError

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate(redirect, { replace: true })
    })
  }, [navigate, redirect])

  async function handleGoogleSignIn() {
    setOauthError(null)
    setStatus('redirecting')

    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })

    if (signInError) {
      setOauthError(signInError.message)
      setStatus('idle')
    }
  }

  return (
    <main className="card">
      <h1>Sign in</h1>
      <p>Continue with your Google account to authorize this connection.</p>
      <div className="stack">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={status === 'redirecting'}
          className="btn btn-primary"
        >
          {status === 'redirecting' ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>
        {displayError && <p className="error">{displayError}</p>}
      </div>
    </main>
  )
}
