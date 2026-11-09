import { CheckCircle2, ClipboardList, ListFilter, SearchX } from 'lucide-react'
import type { Task } from '../types'
import type { TaskFilter } from '../types'
import TaskItem from './TaskItem'

interface TaskListProps {
  /** Already filtered + sorted. */
  tasks: Task[]
  filter: TaskFilter
  totalCommitted: boolean
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onLogWork: () => void
}

export default function TaskList({
  tasks,
  filter,
  totalCommitted,
  onToggle,
  onEdit,
  onDelete,
  onLogWork,
}: TaskListProps) {
  if (tasks.length === 0) {
    const empty = emptyStateFor(filter, totalCommitted)
    const Icon = empty.Icon
    return (
      <div className="glass flex animate-fadeIn flex-col items-center rounded-3xl px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400/15 to-sky2-400/10 text-brand-300">
          <Icon size={30} strokeWidth={1.8} />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-100">{empty.title}</h3>
        <p className="mt-1 max-w-xs text-sm text-slate-400">{empty.body}</p>
        <button
          onClick={onLogWork}
          className="mt-5 rounded-xl bg-gradient-to-r from-brand-400 to-sky2-500 px-5 py-2.5 text-sm font-bold text-ink-900 shadow-glow-sm transition-all hover:brightness-110 active:scale-[0.97]"
        >
          Log work
        </button>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  )
}

function emptyStateFor(filter: TaskFilter, totalCommitted: boolean) {
  if (filter === 'completed') {
    return {
      Icon: CheckCircle2,
      title: totalCommitted ? 'Everything is done' : 'Nothing completed yet',
      body: totalCommitted
        ? 'Every task on your plate is checked off. Take the win.'
        : 'Check off your first task and watch this list fill up with wins.',
    }
  }
  if (filter === 'pending') {
    return {
      Icon: CheckCircle2,
      title: 'All clear',
      body: 'No pending tasks right now. Log tonight’s homework before you forget it.',
    }
  }
  if (filter !== 'all') {
    return {
      Icon: SearchX,
      title: `No ${filter} tasks`,
      body: 'Try a different subject or clear the filter to see everything.',
    }
  }
  if (totalCommitted) {
    return {
      Icon: ClipboardList,
      title: 'Task list is empty',
      body: 'Clear the filter or add new work. Zero clutter, zero excuses.',
    }
  }
  return {
    Icon: ListFilter,
    title: 'No tasks yet',
    body: 'Tap “Log work” and tell StudySentry what’s due. Your future streak starts now.',
  }
}
