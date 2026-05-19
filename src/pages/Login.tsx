import { type FormEvent, useState } from 'react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { checkCanSignInWithEmail, signInBlockedMessage } from '../lib/auth-policy'
import { isOAuthConsentRedirect } from '../lib/oauth-errors'
import { supabase } from '../lib/supabase'

type Step = 'email' | 'otp'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const urlError = searchParams.get('error')
  const oauthFlow = isOAuthConsentRedirect(redirect)

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'sending' | 'verifying'>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const displayError = urlError ?? formError

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(redirect, { replace: true })
    })
  }, [navigate, redirect])

  async function handleSendCode(e: FormEvent) {
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
    // OTP on this page (no emailRedirectTo) — faster for OAuth; avoids expired authorization_id.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    })

    if (otpError) {
      setFormError(otpError.message)
      setStatus('idle')
      return
    }

    setStep('otp')
    setStatus('idle')
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setStatus('verifying')

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    })

    if (verifyError) {
      setFormError(verifyError.message)
      setStatus('idle')
      return
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !sessionData.session) {
      setFormError(sessionError?.message ?? 'Sign-in did not complete. Try again.')
      setStatus('idle')
      return
    }

    navigate(redirect, { replace: true })
  }

  if (step === 'otp') {
    return (
      <main className="card">
        <h1>Enter sign-in code</h1>
        <p>
          We sent a 6-digit code to <strong>{email.trim()}</strong>. Enter it below to continue
          {oauthFlow ? ' and approve the connection' : ''}.
        </p>
        {oauthFlow && (
          <p className="footer" style={{ textAlign: 'left', marginBottom: 12 }}>
            Complete this step soon — the connector authorization request expires after a short
            time.
          </p>
        )}
        <form className="stack" onSubmit={handleVerifyOtp}>
          <label htmlFor="otp">Verification code</label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
            disabled={status === 'verifying'}
          />
          <button
            type="submit"
            disabled={status === 'verifying' || otp.trim().length < 6}
            className="btn btn-primary"
          >
            {status === 'verifying' ? 'Verifying…' : 'Continue'}
          </button>
          <button
            type="button"
            className="link"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => {
              setStep('email')
              setOtp('')
              setFormError(null)
            }}
          >
            Use a different email
          </button>
          {displayError && <p className="error">{displayError}</p>}
        </form>
        <p className="footer">You can also use the magic link in the email if you prefer.</p>
      </main>
    )
  }

  return (
    <main className="card">
      <h1>Sign in</h1>
      <p>Enter your work email. You must already be invited and granted Open Brain access.</p>
      {oauthFlow && (
        <p className="footer" style={{ textAlign: 'left', marginBottom: 12 }}>
          Connecting an app? After you receive the code, enter it here right away — waiting too long
          can expire the authorization.
        </p>
      )}
      <form className="stack" onSubmit={handleSendCode}>
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
              ? 'Sending code…'
              : 'Send sign-in code'}
        </button>
        {displayError && <p className="error">{displayError}</p>}
      </form>
    </main>
  )
}
