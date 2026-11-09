import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskItem from './TaskItem'
import type { Task } from '../types'
import { addDaysISO, todayISO } from '../lib/date'

const baseTask: Task = {
  id: 'task-1',
  title: 'Review calculus integrals',
  subject: 'Math',
  estimatedMinutes: 40,
  priority: 'high',
  dueDate: todayISO(),
  completed: false,
  createdAt: new Date().toISOString(),
  completedAt: null,
}

describe('TaskItem', () => {
  it('renders title, subject, priority, estimate and due chips', () => {
    render(<TaskItem task={baseTask} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('Review calculus integrals')).toBeInTheDocument()
    expect(screen.getByText('Math')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('40m')).toBeInTheDocument()
    expect(screen.getByText('Due today')).toBeInTheDocument()
  })

  it('flags overdue tasks in red-tone chip copy', () => {
    const overdue = { ...baseTask, dueDate: addDaysISO(todayISO(), -3) }
    render(<TaskItem task={overdue} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />)
    expect(screen.getByText(/Overdue · 3 days/)).toBeInTheDocument()
  })

  it('toggles completion via the checkbox', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<TaskItem task={baseTask} onToggle={onToggle} onEdit={() => {}} onDelete={() => {}} />)

    const checkbox = screen.getByRole('checkbox', { name: /mark "review calculus integrals" as done/i })
    expect(checkbox).toHaveAttribute('aria-checked', 'false')
    await user.click(checkbox)
    expect(onToggle).toHaveBeenCalledWith('task-1')
  })

  it('reflects completed state on the checkbox', () => {
    const done = { ...baseTask, completed: true, completedAt: new Date().toISOString() }
    render(<TaskItem task={done} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />)
    const checkbox = screen.getByRole('checkbox', { name: /as not done/i })
    expect(checkbox).toHaveAttribute('aria-checked', 'true')
  })

  it('requires a confirming second tap before deleting', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<TaskItem task={baseTask} onToggle={() => {}} onEdit={() => {}} onDelete={onDelete} />)

    const deleteBtn = screen.getByRole('button', { name: /delete "review calculus integrals"/i })
    await user.click(deleteBtn)
    expect(onDelete).not.toHaveBeenCalled()

    const confirmBtn = screen.getByRole('button', { name: /confirm delete/i })
    await user.click(confirmBtn)
    expect(onDelete).toHaveBeenCalledWith('task-1')
  })

  it('invokes the edit handler', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<TaskItem task={baseTask} onToggle={() => {}} onEdit={onEdit} onDelete={() => {}} />)
    await user.click(screen.getByRole('button', { name: /edit "review calculus integrals"/i }))
    expect(onEdit).toHaveBeenCalledWith(baseTask)
  })
})
