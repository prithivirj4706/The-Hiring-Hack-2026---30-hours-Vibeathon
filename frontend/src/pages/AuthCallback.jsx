import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Icon } from '../components/ui'
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext'

/**
 * Landing strip for the OAuth round-trip. The backend redirects here with
 * ?token=... on success, or ?error=... when the provider or our exchange failed.
 */
export default function AuthCallback() {
  const [params] = useSearchParams()
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(params.get('error') || '')
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token = params.get('token')
    if (!token) {
      setError((current) => current || 'No sign-in token came back from the provider.')
      return
    }

    loginWithToken(token)
      .then((user) => navigate(HOME_BY_ROLE[user.role] ?? '/', { replace: true }))
      .catch((err) => setError(err.message))
  }, [params, loginWithToken, navigate])

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-8 text-center shadow-md">
        {error ? (
          <>
            <Icon name="error" className="mb-3 !text-4xl text-error" />
            <h1 className="mb-2 text-xl font-bold text-on-surface">Sign-in failed</h1>
            <Alert>{error}</Alert>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <Icon name="progress_activity" className="mb-3 !text-4xl animate-spin text-primary" />
            <h1 className="text-xl font-bold text-on-surface">Signing you in…</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Finishing the handshake with your provider.</p>
          </>
        )}
      </div>
    </main>
  )
}
