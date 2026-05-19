import { useEffect } from 'react'
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

function loginWithError(redirect: string, message: string): string {
  const params = new URLSearchParams({
    redirect,
    error: message,
  })
  return `/login?${params.toString()}`
}

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const urlError = readUrlError(searchParams)
    const redirect = searchParams.get('redirect') ?? '/'

    if (urlError) {
      navigate(loginWithError(redirect, urlError), { replace: true })
      return
    }

    let cancelled = false

    async function settle() {
      const code = searchParams.get('code')
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(window.location.href)
        if (exchangeError) {
          if (!cancelled) {
            navigate(loginWithError(redirect, exchangeError.message), { replace: true })
          }
          return
        }
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (cancelled) return
      if (sessionError) {
        navigate(loginWithError(redirect, sessionError.message), { replace: true })
        return
      }

      const session = sessionData.session
      if (!session?.user) {
        navigate(
          loginWithError(redirect, 'Sign-in did not complete. Please try again.'),
          { replace: true },
        )
        return
      }

      const email = session.user.email
      if (!email) {
        await supabase.auth.signOut()
        navigate(
          loginWithError(redirect, 'Your Google account has no email. Contact your administrator.'),
          { replace: true },
        )
        return
      }

      const { invited, error: inviteError } = await checkUserInvited(email)
      if (cancelled) return
      if (inviteError) {
        navigate(loginWithError(redirect, inviteError), { replace: true })
        return
      }
      if (!invited) {
        await supabase.auth.signOut()
        navigate(
          loginWithError(
            redirect,
            'User does not exist. Ask your administrator to invite you before signing in.',
          ),
          { replace: true },
        )
        return
      }

      navigate(redirect, { replace: true })
    }

    settle()

    return () => {
      cancelled = true
    }
  }, [navigate, searchParams])

  return (
    <main className="card">
      <h1>Signing you in…</h1>
    </main>
  )
}
