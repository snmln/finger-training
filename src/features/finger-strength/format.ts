import {
  FINGERS,
  GRIP_TECHNIQUES,
  GRIP_TOOLS,
  type Finger,
  type GripSurface,
  type GripTechnique,
  type WorkoutSet,
} from '../../types'

export function fingerLabel(finger: Finger): string {
  return FINGERS.find((f) => f.value === finger)?.label ?? finger
}

export function techniqueLabel(technique: GripTechnique): string {
  return GRIP_TECHNIQUES.find((t) => t.value === technique)?.label ?? technique
}

export function surfaceLabel(surface: GripSurface): string {
  if (surface.kind === 'custom') {
    return `${surface.sizeMm}mm ${surface.surfaceType === 'pinch' ? 'Pinch' : 'Crimp'}`
  }
  const tool = GRIP_TOOLS.find((t) => t.id === surface.tool)
  const position = tool?.positions.find((p) => p.id === surface.position)
  return `${tool?.label ?? surface.tool} — ${position?.label ?? surface.position}`
}

export function entrySummary(
  set: Pick<WorkoutSet, 'exerciseType' | 'weight' | 'reps' | 'durationSeconds'>,
): string {
  return set.exerciseType === 'timed-hold'
    ? `${set.weight}lb × ${set.durationSeconds}s`
    : `${set.reps}× @ ${set.weight}lb`
}

/**
 * Today's date as a local YYYY-MM-DD string. Deliberately not
 * `new Date().toISOString().slice(0, 10)` — that converts to UTC first,
 * which rolls the date forward in the evening for negative-UTC-offset
 * timezones (most of the Americas).
 */
export function todayLocalISODate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
