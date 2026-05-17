import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { checkMcpAccess } from '../lib/auth-policy'
import { supabase } from '../lib/supabase'

interface OAuthClient {
  client_id: string
  name?: string
  logo_uri?: string | null
  client_uri?: string | null
}

interface AuthorizationDetails {
  client: OAuthClient
  redirect_uri: string
  scope?: string
  state?: string
}

type AuthOAuth = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_to: string } | null; error: { message: string } | null }>
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_to: string } | null; error: { message: string } | null }>
}

function getOAuth(): AuthOAuth {
  const auth = supabase.auth as unknown as { oauth?: AuthOAuth }
  if (!auth.oauth) {
    throw new Error(
      'supabase.auth.oauth is unavailable. Upgrade @supabase/supabase-js to a version that supports the OAuth 2.1 Server beta.',
    )
  }
  return auth.oauth
}

export function OAuthConsent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const authorizationId = searchParams.get('authorization_id')

  const [authDetails, setAuthDetails] = useState<AuthorizationDetails | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<'approve' | 'deny' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!authorizationId) {
        setError('Missing authorization_id in URL.')
        setLoading(false)
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      if (cancelled) return

      if (!userData.user) {
        const next = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`
        navigate(`/login?redirect=${encodeURIComponent(next)}`, { replace: true })
        return
      }
      const email = userData.user.email ?? null
      setUserEmail(email)

      const { allowed, error: accessError } = await checkMcpAccess()
      if (cancelled) return
      if (accessError) {
        setError(accessError)
        setLoading(false)
        return
      }
      if (!allowed) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      try {
        const { data, error: detailsError } =
          await getOAuth().getAuthorizationDetails(authorizationId)
        if (cancelled) return
        if (detailsError) {
          setError(detailsError.message)
        } else if (!data) {
          setError('No authorization request found for this id.')
        } else {
          setAuthDetails(data)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [authorizationId, navigate])

  async function handleDecision(decision: 'approve' | 'deny') {
    if (!authorizationId) return
    setError(null)
    setSubmitting(decision)
    try {
      const oauth = getOAuth()
      const { data, error: decisionError } =
        decision === 'approve'
          ? await oauth.approveAuthorization(authorizationId)
          : await oauth.denyAuthorization(authorizationId)

      if (decisionError) {
        setError(decisionError.message)
        return
      }
      if (data?.redirect_to) {
        window.location.href = data.redirect_to
      } else {
        setError('Supabase did not return a redirect URL.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(null)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    if (authorizationId) {
      const next = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`
      navigate(`/login?redirect=${encodeURIComponent(next)}`, { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }

  if (loading) {
    return (
      <main className="card">
        <h1>Loading…</h1>
      </main>
    )
  }

  if (accessDenied) {
    return (
      <main className="card">
        <h1>Access denied</h1>
        <p className="error">
          Your account (<strong>{userEmail ?? 'unknown'}</strong>) has not been granted access to
          Open Brain.
        </p>
        <p>
          Contact your Open Brain administrator and ask them to grant your user access to one or
          more projects.
        </p>
        <p className="footer">Once granted, return to your client and connect again.</p>
        <div className="actions" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleDecision('deny')}
            disabled={submitting !== null || !authorizationId}
          >
            {submitting === 'deny' ? 'Denying…' : 'Deny connection'}
          </button>
          <button type="button" className="link" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="card">
        <h1>Authorization error</h1>
        <p className="error">{error}</p>
      </main>
    )
  }

  if (!authDetails) {
    return (
      <main className="card">
        <h1>No authorization request</h1>
        <p>This page expects an <code>authorization_id</code> from Supabase Auth.</p>
      </main>
    )
  }

  const scopes = (authDetails.scope ?? '')
    .split(' ')
    .map((s) => s.trim())
    .filter(Boolean)
  const clientName = authDetails.client.name || authDetails.client.client_id

  return (
    <main className="card">
      <header className="stack" style={{ alignItems: 'center', gap: 12 }}>
        {authDetails.client.logo_uri && (
          <img
            src={authDetails.client.logo_uri}
            alt=""
            width={56}
            height={56}
            style={{ borderRadius: 12 }}
          />
        )}
        <h1 style={{ margin: 0 }}>Authorize {clientName}</h1>
        <p style={{ margin: 0 }}>This app wants to access your account.</p>
      </header>

      <dl className="details">
        <div>
          <dt>Signed in as</dt>
          <dd>{userEmail ?? 'unknown'}</dd>
        </div>
        <div>
          <dt>Client</dt>
          <dd>{clientName}</dd>
        </div>
        <div>
          <dt>Redirect URI</dt>
          <dd><code>{authDetails.redirect_uri}</code></dd>
        </div>
        {scopes.length > 0 && (
          <div>
            <dt>Requested permissions</dt>
            <dd>
              <ul className="scope-list">
                {scopes.map((s) => (
                  <li key={s}><code>{s}</code></li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>

      <div className="actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleDecision('deny')}
          disabled={submitting !== null}
        >
          {submitting === 'deny' ? 'Denying…' : 'Deny'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleDecision('approve')}
          disabled={submitting !== null}
        >
          {submitting === 'approve' ? 'Approving…' : `Allow ${clientName}`}
        </button>
      </div>

      <footer className="footer">
        Not you?{' '}
        <button type="button" className="link" onClick={handleSignOut}>
          Sign out
        </button>
      </footer>
    </main>
  )
}
