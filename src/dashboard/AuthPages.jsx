import { useState } from 'react'
import { Chrome, LockKeyhole } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { env } from '../config/env'
import { supabase } from '../lib/supabase'
import { ThemeToggle } from '../components/ThemeToggle'
import { LiveDashboard } from './LiveDashboard'

function AuthLoading({ label = 'Checking your sign-in…' }) {
  return <main className="auth-screen"><p role="status">{label}</p></main>
}

function AuthFrame({ title, intro, children }) {
  return <main className="auth-screen">
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-header-row">
        <Link to="/" className="wordmark auth-wordmark" aria-label="Dhiledger home"><img className="brand-logo" src="/IMG-20261010-WA0008.jpg" alt="Dhiledger" /></Link>
        <ThemeToggle />
      </div>
      <span className="eyebrow">Private workspace</span>
      <h1 id="auth-title">{title}</h1>
      <p className="auth-intro">{intro}</p>
      {children}
      <Link className="auth-back-link" to="/">Back to Dhiledger</Link>
    </section>
  </main>
}

export function LoginPage() {
  const { user, loading, error: sessionError } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <AuthLoading />
  if (user) return <Navigate to="/dashboard" replace />

  const signIn = async () => {
    if (!supabase) return
    setSubmitting(true)
    setError('')
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (signInError) throw signInError
    } catch (signInError) {
      setError(signInError.message || 'Google sign-in could not be started.')
      setSubmitting(false)
    }
  }

  return <AuthFrame title="Sign in to your workspace" intro="Use your Google account to access your private Dhiledger workspace.">
    {!env.hasSupabase && <div className="auth-notice" role="status">Workspace sign-in is not configured yet. Add the Supabase project URL and public anon key, then enable Google in Supabase Auth.</div>}
    {(error || sessionError) && <div className="auth-error" role="alert">{error || sessionError}</div>}
    <button className="google-signin" type="button" onClick={signIn} disabled={!env.hasSupabase || submitting}>
      <Chrome size={18} aria-hidden="true" />
      {submitting ? 'Redirecting to Google…' : 'Continue with Google'}
    </button>
    <p className="auth-privacy"><LockKeyhole size={14} /> Your workspace data is private to your account.</p>
  </AuthFrame>
}

export function AuthCallbackPage() {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading label="Finishing Google sign-in…" />
  if (user) return <Navigate to="/dashboard" replace />

  return <AuthFrame title="Sign-in did not finish" intro="No active session was returned from Google. Try signing in again.">
    <Link className="button button-primary auth-retry" to="/login">Return to sign in</Link>
  </AuthFrame>
}

export function ProtectedDashboard() {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace />
  return <LiveDashboard user={user} />
}