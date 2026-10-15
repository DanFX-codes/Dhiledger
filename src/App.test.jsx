import { render, screen } from '@testing-library/react'
import { cleanup } from '@testing-library/react'
import { describe, expect, it, afterEach } from 'vitest'
import App from './App'
import { capabilities } from './config/capabilities'
import { legalPages } from './config/content'

afterEach(() => {
  cleanup()
  window.history.pushState({}, '', '/')
})

function renderAt(path) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('Dhiledger routes', () => {
  it('renders the homepage with the official tagline and clear sample labeling', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1, name: /find the money you’re losing/i })).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: 'Dhiledger' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/sample data/i).length).toBeGreaterThan(0)
  })

  it('renders the demo banner and read-only report explanation', () => {
    renderAt('/demo/reports')
    expect(screen.getByText(/demo · sample data, not a live account/i)).toBeInTheDocument()
    expect(screen.getByText(/no file is generated or downloaded/i)).toBeInTheDocument()
  })

  it('renders every legal title with an empty content region', () => {
    legalPages.forEach((page) => {
      const { unmount } = renderAt(page.path)
      expect(screen.getByRole('heading', { name: page.title })).toBeInTheDocument()
      expect(screen.getByTestId('legal-content')).toBeEmptyDOMElement()
      unmount()
    })
  })

  it('keeps every capability out of the available state by default', () => {
    expect(capabilities.every((capability) => capability.status !== 'available')).toBe(true)
  })

  it('protects the dashboard and reports when Google sign-in is not configured', async () => {
    renderAt('/dashboard/overview')
    expect(await screen.findByRole('heading', { name: /sign in to your workspace/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled()
    expect(screen.getByText(/workspace sign-in is not configured yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /password/i })).not.toBeInTheDocument()
  })

  it('keeps forms visibly disabled when no endpoint is configured', () => {
    renderAt('/request-access')
    expect(screen.getByText(/this form is not accepting submissions yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send request/i })).toBeDisabled()
  })
})
