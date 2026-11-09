export const SUBJECTS = ['Math', 'Science', 'History', 'English', 'Elective', 'Other'] as const
export type Subject = (typeof SUBJECTS)[number]

export const PRIORITIES = ['high', 'medium', 'low'] as const
export type Priority = (typeof PRIORITIES)[number]

export interface Task {
  id: string
  title: string
  subject: Subject
  estimatedMinutes: number
  priority: Priority
  /** Due date as a local YYYY-MM-DD calendar day. */
  dueDate: string
  completed: boolean
  /** ISO timestamp of creation. */
  createdAt: string
  /** ISO timestamp of completion, or null while pending. */
  completedAt: string | null
}

/** Fields the user (or a form) supplies when creating a task. */
export type NewTaskInput = Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>

export type TaskFilter = 'all' | 'pending' | 'completed' | Subject

/** Minimal shape of the non-standard `beforeinstallprompt` event. */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}
