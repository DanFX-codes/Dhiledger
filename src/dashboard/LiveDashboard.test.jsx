import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LiveDashboard } from './LiveDashboard'
import { supabase } from '../lib/supabase'

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

  render(<LiveDashboard user={{ id: 'user-1', email: 'taylor@example.com', user_metadata: userMetadata }} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  supabase.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null })
})

describe('LiveDashboard profile editor', () => {
  it('persists edited profile fields while preserving other account metadata', async () => {
    setup({ full_name: 'Taylor Morgan', company_name: 'Northstar', locale: 'en' })

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), { target: { value: 'Taylor Lee' } })
    fireEvent.change(screen.getByRole('textbox', { name: /company/i }), { target: { value: 'Northstar Labs' } })
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Taylor Lee', company_name: 'Northstar Labs', locale: 'en' },
    }))
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument()
  })

  it('shows the Supabase error if saving profile metadata fails', async () => {
    supabase.auth.updateUser.mockResolvedValueOnce({ error: new Error('Profile update failed') })
    setup()

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Profile update failed')
  })
})
