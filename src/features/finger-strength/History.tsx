import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteWorkoutCascade } from '../../db'
import type { WorkoutSet } from '../../types'
import { entrySummary, fingerLabel, formatDate, surfaceLabel, techniqueLabel } from './format'

function SetRow({ set }: { set: WorkoutSet }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-basalt px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-tape/30 bg-tape/10 px-2 py-0.5 text-[11px] font-medium text-tape">
          {surfaceLabel(set.gripSurface)}
        </span>
        {set.gripTechnique && (
          <span className="text-xs text-chalk/40">{techniqueLabel(set.gripTechnique)}</span>
        )}
        <span className="text-xs uppercase tracking-wide text-chalk/40">{set.handSide}</span>
      </div>
      <div className="font-mono text-xs text-chalk/80">
        {set.fingers.map(fingerLabel).join(', ')}
        <span className="text-chalk/50"> — {entrySummary(set)}</span>
      </div>
    </div>
  )
}

export default function History() {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const workouts = useLiveQuery(() => db.workouts.orderBy('date').reverse().toArray(), [])

  const setsByWorkout = useLiveQuery(async () => {
    const all = await db.workoutSets.toArray()
    const map = new Map<number, WorkoutSet[]>()
    for (const s of all) {
      const arr = map.get(s.workoutId) ?? []
      arr.push(s)
      map.set(s.workoutId, arr)
    }
    return map
  }, [])

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await deleteWorkoutCascade(id)
      if (expandedId === id) setExpandedId(null)
    } finally {
      setDeletingId(null)
    }
  }

  if (workouts === undefined || setsByWorkout === undefined) {
    return <p className="text-sm text-chalk/40">Loading…</p>
  }

  if (workouts.length === 0) {
    return (
      <div className="rounded-xl border border-basalt-light bg-basalt-surface px-4 py-10 text-center">
        <p className="text-sm text-chalk/50">No workouts logged yet.</p>
        <p className="mt-1 text-xs text-chalk/30">Log your first session from the Log tab.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {workouts.map((workout) => {
        const sets = setsByWorkout.get(workout.id!) ?? []
        const isExpanded = expandedId === workout.id

        return (
          <div
            key={workout.id}
            className="overflow-hidden rounded-xl border border-basalt-light bg-basalt-surface"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : workout.id!)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              aria-expanded={isExpanded}
            >
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-chalk">
                  {formatDate(workout.date)}
                </p>
                <p className="truncate text-xs text-chalk/40">
                  {sets.length} set{sets.length === 1 ? '' : 's'}
                  {workout.notes ? ` · ${workout.notes}` : ''}
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`shrink-0 text-chalk/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isExpanded && (
              <div className="flex flex-col gap-2 border-t border-basalt-light px-4 py-3">
                {sets.length === 0 ? (
                  <p className="text-xs text-chalk/40">No sets recorded.</p>
                ) : (
                  sets.map((set) => <SetRow key={set.id} set={set} />)
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(workout.id!)}
                  disabled={deletingId === workout.id}
                  className="mt-1 self-start rounded-md px-2 py-1 text-xs font-medium text-crimson transition-colors hover:bg-crimson/10 disabled:opacity-40"
                >
                  {deletingId === workout.id ? 'Deleting…' : 'Delete workout'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
