import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskModal from './TaskModal'
import { todayISO } from '../lib/date'

describe('TaskModal', () => {
  it('asks what work is due on launch copy', () => {
    render(<TaskModal open onClose={() => {}} onSubmit={() => {}} />)
    expect(
      screen.getByRole('dialog', { name: /what work do you have to get done today/i }),
    ).toBeInTheDocument()
  })

  it('keeps the submit button disabled until a title is provided', async () => {
    const user = userEvent.setup()
    render(<TaskModal open onClose={() => {}} onSubmit={() => {}} />)

    const submit = screen.getByRole('button', { name: /add task/i })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText(/^task$/i), 'Read chemistry chapter 7')
    expect(submit).toBeEnabled()
  })

  it('submits trimmed values with defaults (subject Math, 30 min, medium, due today)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    render(<TaskModal open onClose={onClose} onSubmit={onSubmit} />)

    const input = screen.getByLabelText(/^task$/i)
    await user.type(input, '  Finish algebra worksheet  ')
    await user.click(screen.getByRole('button', { name: /add task/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Finish algebra worksheet',
      subject: 'Math',
      estimatedMinutes: 30,
      priority: 'medium',
      dueDate: todayISO(),
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('lets the user pick subject, priority and minutes', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TaskModal open onClose={() => {}} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/^task$/i), 'History DBQ essay')
    await user.selectOptions(screen.getByLabelText(/subject/i), 'History')
    await user.click(screen.getByRole('button', { name: '60m' }))
    await user.click(screen.getByRole('button', { name: /high/i }))
    await user.click(screen.getByRole('button', { name: /add task/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'History', estimatedMinutes: 60, priority: 'high' }),
    )
  })

  it('closes via Escape key', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TaskModal open onClose={onClose} onSubmit={() => {}} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<TaskModal open onClose={onClose} onSubmit={() => {}} />)
    await user.click(screen.getByRole('button', { name: /close dialog/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders in edit mode with prefilled values', () => {
    render(
      <TaskModal
        open
        onClose={() => {}}
        onSubmit={() => {}}
        initialTask={{
          id: 'abc',
          title: 'Existing essay',
          subject: 'English',
          estimatedMinutes: 45,
          priority: 'high',
          dueDate: '2026-12-01',
          completed: false,
          createdAt: new Date().toISOString(),
          completedAt: null,
        }}
      />,
    )

    expect(screen.getByRole('dialog', { name: /edit task/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^task$/i)).toHaveValue('Existing essay')
    expect(screen.getByLabelText(/subject/i)).toHaveValue('English')
    expect(screen.getByLabelText(/est\. minutes/i)).toHaveValue(45)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})
