import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Home() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <main className="card">
      <h1>Open Brain Auth</h1>
      <p>Supabase OAuth 2.1 authorization UI.</p>
      <ul>
        <li>
          OAuth consent page lives at <code>/oauth/consent?authorization_id=…</code>
        </li>
        <li>Configure this URL as the Site URL + Authorization Path in Supabase.</li>
      </ul>
      <p>
        {email ? (
          <>
            Signed in as <strong>{email}</strong>.{' '}
            <button
              type="button"
              className="link"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Sign in
          </Link>
        )}
      </p>
    </main>
  )
}
