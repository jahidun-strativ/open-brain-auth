import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { checkUserInvited } from '../lib/auth-policy'
import { supabase } from '../lib/supabase'

function readUrlError(params: URLSearchParams): string | null {
  if (typeof window !== 'undefined' && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const fromHash = hashParams.get('error_description') ?? hashParams.get('error')
    if (fromHash) return fromHash
  }
  return params.get('error_description') ?? params.get('error')
}

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(() => readUrlError(searchParams))

  useEffect(() => {
    if (error) return
    let cancelled = false
    const redirect = searchParams.get('redirect') ?? '/'

    async function settle() {
      const code = searchParams.get('code')
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(window.location.href)
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message)
          return
        }
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (cancelled) return
      if (sessionError) {
        setError(sessionError.message)
        return
      }

      const session = sessionData.session
      if (!session?.user) {
        setError('Sign-in did not complete. Please try again from the login page.')
        return
      }

      const email = session.user.email
      if (email) {
        const { invited, error: inviteError } = await checkUserInvited(email)
        if (cancelled) return
        if (inviteError) {
          setError(inviteError)
          return
        }
        if (!invited) {
          await supabase.auth.signOut()
          setError('User does not exist. Contact your administrator.')
          return
        }
      }

      navigate(redirect, { replace: true })
    }

    settle()

    return () => {
      cancelled = true
    }
  }, [error, navigate, searchParams])

  if (error) {
    return (
      <main className="card">
        <h1>Sign-in failed</h1>
        <p className="error">{error}</p>
      </main>
    )
  }
  return (
    <main className="card">
      <h1>Signing you in…</h1>
    </main>
  )
}
