import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Magic-link return target. With `flowType: 'implicit'` and
 * `detectSessionInUrl: true`, supabase-js parses the access/refresh tokens
 * from the URL hash automatically as soon as the client boots. We wait for
 * that to settle (either via `onAuthStateChange` or a direct `getSession`
 * check) and then forward to the originally-requested page.
 */
function readUrlError(params: URLSearchParams): string | null {
  // Supabase reports auth errors in the URL hash as well as the query string,
  // depending on the path that produced the redirect.
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

    function go() {
      if (cancelled) return
      navigate(redirect, { replace: true })
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) go()
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go()
    })

    const timeout = window.setTimeout(() => {
      if (cancelled) return
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return
        if (data.session) {
          go()
        } else {
          setError('Sign-in did not complete. Please request a new magic link.')
        }
      })
    }, 4000)

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
      window.clearTimeout(timeout)
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
