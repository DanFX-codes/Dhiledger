import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LiveDashboard } from './LiveDashboard'
import { ProfilePage } from './AuthPages'
import { supabase } from '../lib/supabase'

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'taylor@example.com', user_metadata: { full_name: 'Taylor Morgan', company_name: 'Northstar', locale: 'en' } },
    loading: false,
    error: '',
  }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { updateUser: vi.fn(), signOut: vi.fn() },
    channel: vi.fn(),
    from: vi.fn(),
    removeChannel: vi.fn(),
  },
}))

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
  supabase.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null })
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
