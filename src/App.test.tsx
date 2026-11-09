import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from './App'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

describe('App (smoke)', () => {
  it('renders the header, greeting, progress and tabs without crashing', async () => {
    render(<App />)

    const banner = screen.getByRole('banner')
    expect(within(banner).getByText('Sentry')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /tasks/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /insights/i })).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /log work/i }).length).toBeGreaterThan(0)

    // "The Nag" opens shortly after launch for brand-new users.
    expect(await screen.findByRole('dialog', {}, { timeout: 2000 })).toBeInTheDocument()
  })

  it('shows an insights tab when clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: /insights/i }))
    expect(screen.getByText(/this week/i)).toBeInTheDocument()
  })
})
