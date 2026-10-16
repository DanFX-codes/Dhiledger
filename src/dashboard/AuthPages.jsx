import { useState } from 'react'
import { ArrowRight, Chrome, Github, LockKeyhole } from 'lucide-react'
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
  const [credentials, setCredentials] = useState({ email: '', password: '' })

  if (loading) return <AuthLoading />
  if (user) return <Navigate to="/dashboard" replace />

  const updateCredentials = (event) => setCredentials((current) => ({ ...current, [event.target.name]: event.target.value }))

  const signInWithPassword = async (event) => {
    event.preventDefault()
    if (!supabase) return
    setSubmitting(true)
    setError('')
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      })
      if (signInError) throw signInError
    } catch (signInError) {
      setError(signInError.message || 'Sign-in could not be completed.')
    } finally {
      setSubmitting(false)
    }
  }

  const signInWithProvider = async (provider) => {
    if (!supabase) return
    setSubmitting(true)
    setError('')
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (signInError) throw signInError
    } catch (signInError) {
      setError(signInError.message || `${provider} sign-in could not be started.`)
      setSubmitting(false)
    }
  }

  return <AuthFrame title="Sign in to your workspace" intro="Use your email and password or Google account to access your private Dhiledger workspace.">
    {!env.hasSupabase && <div className="auth-notice" role="status">Workspace sign-in is not configured yet. Add the Supabase project URL and public anon key, then enable the providers you want to offer in Supabase Auth.</div>}
    {(error || sessionError) && <div className="auth-error" role="alert">{error || sessionError}</div>}
    <form className="auth-form" onSubmit={signInWithPassword}>
      <label className="workspace-field">Email address<input name="email" type="email" autoComplete="email" value={credentials.email} onChange={updateCredentials} required disabled={!env.hasSupabase} /></label>
      <label className="workspace-field">Password<input name="password" type="password" autoComplete="current-password" value={credentials.password} onChange={updateCredentials} required disabled={!env.hasSupabase} /></label>
      <button className="button button-primary auth-submit" type="submit" disabled={!env.hasSupabase || submitting}>{submitting ? 'Signing in…' : 'Sign in'}<ArrowRight size={16} aria-hidden="true" /></button>
    </form>
    <div className="auth-divider"><span>or</span></div>
    <div className="auth-provider-list">
      <button className="auth-provider-button" type="button" onClick={() => signInWithProvider('google')} disabled={!env.hasSupabase || submitting}>
        <Chrome size={18} aria-hidden="true" />{submitting ? 'Redirecting…' : 'Continue with Google'}
      </button>
      <button className="auth-provider-button" type="button" onClick={() => signInWithProvider('github')} disabled={!env.hasSupabase || submitting}>
        <Github size={18} aria-hidden="true" />{submitting ? 'Redirecting…' : 'Continue with GitHub'}
      </button>
    </div>
    <p className="auth-privacy"><LockKeyhole size={14} /> Your workspace data is private to your account.</p>
    <p className="auth-switch">New to Dhiledger? <Link to="/signup">Create an account</Link></p>
  </AuthFrame>
}

export function SignUpPage() {
  const { user, loading } = useAuth()
  const [form, setForm] = useState({ full_name: '', company_name: '', email: '', password: '', password_confirmation: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (loading) return <AuthLoading />
  if (user) return <Navigate to="/dashboard" replace />

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const signInWithProvider = async (provider) => {
    if (!supabase) return
    setSubmitting(true)
    setError('')
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (signInError) throw signInError
    } catch (signInError) {
      setError(signInError.message || `${provider} sign-in could not be started.`)
      setSubmitting(false)
    }
  }

  const createAccount = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (form.password !== form.password_confirmation) {
      setError('Your passwords do not match.')
      return
    }
    if (!supabase) return

    setSubmitting(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: form.full_name.trim(), company_name: form.company_name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (signUpError) throw signUpError
      setNotice('Your account is ready. Check your email to confirm your address before signing in.')
      setForm((current) => ({ ...current, password: '', password_confirmation: '' }))
    } catch (signUpError) {
      setError(signUpError.message || 'Your account could not be created. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <AuthFrame title="Create your account" intro="Set up a private workspace for your team. You can update these details later.">
    {!env.hasSupabase && <div className="auth-notice" role="status">Account creation is not configured yet. Add the Supabase project URL and public anon key, then enable the providers you want to offer in Supabase Auth.</div>}
    {error && <div className="auth-error" role="alert">{error}</div>}
    {notice && <div className="auth-notice" role="status">{notice}</div>}
    <form className="auth-form" onSubmit={createAccount}>
      <label className="workspace-field">Full name<input name="full_name" autoComplete="name" value={form.full_name} onChange={updateForm} required disabled={!env.hasSupabase} /></label>
      <label className="workspace-field">Company name<input name="company_name" autoComplete="organization" value={form.company_name} onChange={updateForm} required disabled={!env.hasSupabase} /></label>
      <label className="workspace-field">Work email<input name="email" type="email" autoComplete="email" value={form.email} onChange={updateForm} required disabled={!env.hasSupabase} /></label>
      <label className="workspace-field">Password<input name="password" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={updateForm} required disabled={!env.hasSupabase} /></label>
      <p className="auth-password-hint">Use at least 8 characters.</p>
      <label className="workspace-field">Confirm password<input name="password_confirmation" type="password" autoComplete="new-password" minLength={8} value={form.password_confirmation} onChange={updateForm} required disabled={!env.hasSupabase} /></label>
      <button className="button button-primary auth-submit" type="submit" disabled={!env.hasSupabase || submitting}>{submitting ? 'Creating account…' : 'Create account'}<ArrowRight size={16} aria-hidden="true" /></button>
    </form>
    <div className="auth-divider"><span>or continue with</span></div>
    <div className="auth-provider-list">
      <button className="auth-provider-button" type="button" onClick={() => signInWithProvider('google')} disabled={!env.hasSupabase || submitting}>
        <Chrome size={18} aria-hidden="true" />{submitting ? 'Redirecting…' : 'Google'}
      </button>
      <button className="auth-provider-button" type="button" onClick={() => signInWithProvider('github')} disabled={!env.hasSupabase || submitting}>
        <Github size={18} aria-hidden="true" />{submitting ? 'Redirecting…' : 'GitHub'}
      </button>
    </div>
    <p className="auth-privacy"><LockKeyhole size={14} /> Your workspace data is private to your account.</p>
    <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
  </AuthFrame>
}

export function AuthCallbackPage() {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading label="Finishing sign-in…" />
  if (user) return <Navigate to="/dashboard" replace />

  return <AuthFrame title="Sign-in did not finish" intro="No active session was returned. Try signing in again.">
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