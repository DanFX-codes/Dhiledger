import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LiveDashboard, parseLedgerCsv } from './LiveDashboard'
import { LoginPage, ProfilePage, SignUpPage } from './AuthPages'
import { supabase } from '../lib/supabase'

const { authState } = vi.hoisted(() => ({
  authState: { user: { id: 'user-1', email: 'taylor@example.com', user_metadata: { full_name: 'Taylor Morgan', company_name: 'Northstar', locale: 'en' } }, loading: false, error: '' },
}))

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => authState,
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { updateUser: vi.fn(), signOut: vi.fn(), signUp: vi.fn(), signInWithPassword: vi.fn(), signInWithOAuth: vi.fn() },
    channel: vi.fn(),
    from: vi.fn(),
    removeChannel: vi.fn(),
  },
}))

vi.mock('../config/env', () => ({ env: { hasSupabase: true } }))

function setup(userMetadata = { full_name: 'Taylor Morgan', company_name: 'Northstar' }) {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn() }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValueOnce(query).mockResolvedValueOnce({ data: [], error: null })
  supabase.from.mockReturnValue(query)

  const channel = { on: vi.fn(), subscribe: vi.fn() }
  channel.on.mockReturnValue(channel)
  channel.subscribe.mockReturnValue(channel)
  supabase.channel.mockReturnValue(channel)

  render(
    <MemoryRouter>
      <LiveDashboard user={{ id: 'user-1', email: 'taylor@example.com', user_metadata: userMetadata }} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.user = { id: 'user-1', email: 'taylor@example.com', user_metadata: { full_name: 'Taylor Morgan', company_name: 'Northstar', locale: 'en' } }
  authState.loading = false
  supabase.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null })
  supabase.auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: null })
  supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
  supabase.auth.signInWithOAuth.mockResolvedValue({ error: null })
})

describe('OAuth sign-up', () => {
  it('starts GitHub OAuth and returns through the auth callback', async () => {
    authState.user = null
    render(<MemoryRouter><SignUpPage /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /github/i }))

    await waitFor(() => expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    }))
  })
})

describe('CSV ledger import', () => {
  it('maps common CSV columns into ledger entries', () => {
    expect(parseLedgerCsv('Vendor,Amount,Date,Description\nAWS,"$1,200.00",2026-10-01,Annual hosting')).toEqual([{
      vendor: 'AWS',
      category: 'Other',
      amount: 1200,
      currency: 'USD',
      transaction_date: '2026-10-01',
      note: 'Annual hosting',
    }])
  })

  it('previews a CSV and imports the validated rows to the ledger', async () => {
    const imported = [{ id: 'entry-2', vendor: 'AWS', category: 'Cloud infrastructure', amount: 125.5, currency: 'USD', transaction_date: '2026-10-01', note: null, created_at: '2026-10-01T12:00:00Z' }]
    const insertQuery = { insert: vi.fn(), select: vi.fn() }
    insertQuery.insert.mockReturnValue(insertQuery)
    insertQuery.select.mockResolvedValue({ data: imported, error: null })
    setup()

    const file = new window.File(['vendor,amount,currency,transaction_date,category\nAWS,125.50,USD,2026-10-01,Cloud infrastructure'], 'october.csv', { type: 'text/csv' })
    fireEvent.change(screen.getByLabelText(/choose expense csv file/i), { target: { files: [file] } })
    expect(await screen.findByText('1 expense ready to review.')).toBeInTheDocument()

    supabase.from.mockReturnValueOnce(insertQuery)
    fireEvent.click(screen.getByRole('button', { name: /import 1 expense/i }))

    await waitFor(() => expect(insertQuery.insert).toHaveBeenCalledWith([{
      vendor: 'AWS',
      category: 'Cloud infrastructure',
      amount: 125.5,
      currency: 'USD',
      transaction_date: '2026-10-01',
      note: null,
    }]))
    expect(await screen.findByText('Imported 1 expense.')).toBeInTheDocument()
  })

  it('rejects malformed amounts before any database insert', () => {
    expect(() => parseLedgerCsv('vendor,amount\nAWS,-10')).toThrow(/amount greater than zero/i)
  })
})

describe('Password sign-in', () => {
  it('signs in with the submitted email and password', async () => {
    authState.user = null
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), { target: { value: 'taylor@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123!' } })
    fireEvent.click(screen.getByRole('button', { name: /^sign in/i }))

    await waitFor(() => expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'taylor@example.com',
      password: 'Password123!',
    }))
  })
})

describe('SignUpPage', () => {
  it('creates an account with name and company metadata and requests email confirmation', async () => {
    authState.user = null
    render(<MemoryRouter><SignUpPage /></MemoryRouter>)

    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), { target: { value: 'Taylor Morgan' } })
    fireEvent.change(screen.getByRole('textbox', { name: /company name/i }), { target: { value: 'Northstar' } })
    fireEvent.change(screen.getByRole('textbox', { name: /work email/i }), { target: { value: 'taylor@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'taylor@example.com',
      password: 'Password123!',
      options: {
        data: { full_name: 'Taylor Morgan', company_name: 'Northstar' },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    }))
    expect(await screen.findByRole('status')).toHaveTextContent('Check your email to confirm your address')
  })
})

describe('LiveDashboard profile editor', () => {
  it('links the dashboard to the profile settings page', () => {
    setup({ full_name: 'Taylor Morgan', company_name: 'Northstar', locale: 'en' })

    expect(screen.getByRole('link', { name: /edit profile/i })).toHaveAttribute('href', '/dashboard/profile')
  })

  it('persists edited profile fields while preserving other account metadata', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    const fullName = screen.getByRole('textbox', { name: /full name/i })
    fireEvent.change(fullName, { target: { value: 'Taylor Lee' } })
    fireEvent.change(screen.getByRole('textbox', { name: /company/i }), { target: { value: 'Northstar Labs' } })
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Taylor Lee', company_name: 'Northstar Labs', locale: 'en' },
    }))
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument()
  })

  it('shows the Supabase error if saving profile metadata fails', async () => {
    supabase.auth.updateUser.mockResolvedValueOnce({ error: new Error('Profile update failed') })
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Profile update failed')
  })

  it('tells the user to initialize the ledger table when it is missing in Supabase', async () => {
    const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn() }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.order.mockReturnValueOnce(query).mockResolvedValueOnce({
      data: null,
      error: { message: "Could not find the table 'public.ledger_entries' in the schema cache" },
    })
    supabase.from.mockReturnValue(query)

    render(
      <MemoryRouter>
        <LiveDashboard user={{ id: 'user-1', email: 'taylor@example.com', user_metadata: { full_name: 'Taylor Morgan' } }} />
      </MemoryRouter>
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Run the SQL in supabase/schema.sql')
  })
})
