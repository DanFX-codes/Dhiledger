import { useState } from 'react'
import { Chrome, LockKeyhole } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { env } from '../config/env'
import { supabase } from '../lib/supabase'
import { ThemeToggle } from '../components/ThemeToggle'
import { LiveDashboard } from './LiveDashboard'

export function ProfilePage() {
  const { user, loading } = useAuth()
  const [profileForm, setProfileForm] = useState({
    full_name: user?.user_metadata?.full_name || '',
    company_name: user?.user_metadata?.company_name || '',
    locale: user?.user_metadata?.locale || '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  if (loading) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace />

  const updateProfileForm = (event) => setProfileForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const saveProfile = async (event) => {
    event.preventDefault()
    setProfileSaving(true)
    setProfileMessage('')

    const nextMetadata = {
      ...(user.user_metadata || {}),
      full_name: profileForm.full_name.trim(),
      company_name: profileForm.company_name.trim(),
      locale: profileForm.locale || user.user_metadata?.locale || '',
    }

    const { data, error: updateError } = await supabase.auth.updateUser({ data: nextMetadata })
    if (updateError) {
      setProfileMessage(updateError.message)
      setProfileSaving(false)
      return
    }

    const mergedMetadata = {
      ...(user.user_metadata || {}),
      ...(data?.user?.user_metadata || {}),
      full_name: nextMetadata.full_name,
      company_name: nextMetadata.company_name,
      locale: nextMetadata.locale,
    }

    setProfileForm({
      full_name: mergedMetadata.full_name || '',
      company_name: mergedMetadata.company_name || '',
      locale: mergedMetadata.locale || '',
    })
    setProfileMessage('Profile saved.')
    setProfileSaving(false)
  }

  return <main className="auth-screen"><section className="auth-panel" aria-labelledby="profile-title">
    <div className="auth-header-row">
      <Link to="/dashboard" className="wordmark auth-wordmark" aria-label="Back to dashboard"><img className="brand-logo" src="/IMG-20261010-WA0008.jpg" alt="Dhiledger" /></Link>
      <ThemeToggle />
    </div>
    <span className="eyebrow">Account settings</span>
    <h1 id="profile-title">Edit profile</h1>
    <p className="auth-intro">Update the details that appear in your private workspace.</p>
    <form className="workspace-profile-editor" onSubmit={saveProfile}>
      <label className="workspace-field">Full name<input name="full_name" value={profileForm.full_name} onChange={updateProfileForm} /></label>
      <label className="workspace-field">Company<input name="company_name" value={profileForm.company_name} onChange={updateProfileForm} /></label>
      <label className="workspace-field">Locale<input name="locale" value={profileForm.locale} onChange={updateProfileForm} /></label>
      {profileMessage && <p className={profileMessage === 'Profile saved.' ? 'workspace-success' : 'workspace-error'} role={profileMessage === 'Profile saved.' ? 'status' : 'alert'}>{profileMessage}</p>}
      <div className="workspace-profile-actions">
        <button className="button button-primary" type="submit" disabled={profileSaving}>{profileSaving ? 'Saving…' : 'Save profile'}</button>
        <Link className="button button-secondary" to="/dashboard">Cancel</Link>
      </div>
    </form>
    <Link className="auth-back-link" to="/dashboard">Back to dashboard</Link>
  </section></main>
}

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

export function ProtectedProfilePage() {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace />
  return <ProfilePage />
}