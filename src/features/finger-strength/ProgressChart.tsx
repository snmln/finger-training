import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { db } from '../../db'
import { EXERCISE_TYPES, FINGERS, GRIP_TECHNIQUES, type ExerciseType, type Finger, type GripTechnique } from '../../types'
import { fingerLabel, formatShortDate, techniqueLabel } from './format'

interface ChartPoint {
  date: string
  weight: number
  metric: string
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-tape bg-tape/15 text-tape'
          : 'border-basalt-light text-chalk/60 hover:border-chalk/30 hover:text-chalk'
      }`}
    >
      {label}
    </button>
  )
}

export default function ProgressChart() {
  const [exerciseType, setExerciseType] = useState<ExerciseType>('timed-hold')
  const [techniqueFilter, setTechniqueFilter] = useState<GripTechnique | 'all'>('all')
  const [fingerFilter, setFingerFilter] = useState<Finger>('index')

  const workouts = useLiveQuery(() => db.workouts.toArray(), [])
  const sets = useLiveQuery(() => db.workoutSets.toArray(), [])

  const data = useMemo<ChartPoint[]>(() => {
    if (!workouts || !sets) return []
    const dateById = new Map(workouts.map((w) => [w.id!, w.date]))
    const byDate = new Map<string, ChartPoint>()

    for (const set of sets) {
      if (set.exerciseType !== exerciseType) continue
      if (techniqueFilter !== 'all' && set.gripTechnique !== techniqueFilter) continue
      if (!set.fingers.includes(fingerFilter)) continue

      const date = dateById.get(set.workoutId)
      if (!date) continue

      const metric =
        set.exerciseType === 'timed-hold' ? `${set.durationSeconds}s hold` : `${set.reps} reps`

      // Keep the best (heaviest) set of the day, so the trend line tracks
      // session PRs rather than every rep scheme thrown at the finger.
      const existing = byDate.get(date)
      if (!existing || set.weight > existing.weight) {
        byDate.set(date, { date, weight: set.weight, metric })
      }
    }

    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [workouts, sets, exerciseType, techniqueFilter, fingerFilter])

  const maxWeight = data.length > 0 ? Math.max(...data.map((d) => d.weight)) : null
  const isLoading = workouts === undefined || sets === undefined

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-basalt-light bg-basalt-surface p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-chalk/60">
          Filters
        </h2>
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-chalk/50">Exercise type</p>
            <div className="flex flex-wrap gap-1.5">
              {EXERCISE_TYPES.map((et) => (
                <FilterChip
                  key={et.value}
                  label={et.label}
                  active={exerciseType === et.value}
                  onClick={() => setExerciseType(et.value)}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-chalk/50">Grip technique</p>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                label="All"
                active={techniqueFilter === 'all'}
                onClick={() => setTechniqueFilter('all')}
              />
              {GRIP_TECHNIQUES.map((gt) => (
                <FilterChip
                  key={gt.value}
                  label={gt.label}
                  active={techniqueFilter === gt.value}
                  onClick={() => setTechniqueFilter(gt.value)}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-chalk/50">Finger</p>
            <div className="flex flex-wrap gap-1.5">
              {FINGERS.map((f) => (
                <FilterChip
                  key={f.value}
                  label={f.label}
                  active={fingerFilter === f.value}
                  onClick={() => setFingerFilter(f.value)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-basalt-light bg-basalt-surface p-4">
        <h2 className="mb-1 font-display text-sm font-semibold uppercase tracking-wide text-chalk/60">
          Weight over time
        </h2>
        <p className="mb-4 text-xs text-chalk/40">
          {fingerLabel(fingerFilter)} · {techniqueFilter === 'all' ? 'all techniques' : techniqueLabel(techniqueFilter)} ·
          best set per session
        </p>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-chalk/40">Loading…</p>
        ) : data.length === 0 ? (
          <p className="py-10 text-center text-sm text-chalk/40">
            No data yet for these filters.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#2C3033" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fill: '#EDEAE3', fillOpacity: 0.5, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2C3033' }}
                />
                <YAxis
                  tick={{ fill: '#EDEAE3', fillOpacity: 0.5, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  unit="lb"
                />
                <Tooltip
                  contentStyle={{
                    background: '#212427',
                    border: '1px solid #2C3033',
                    borderRadius: 8,
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#EDEAE3' }}
                  labelFormatter={(value) => formatShortDate(String(value))}
                  formatter={(value, _name, props) => [
                    `${value}lb · ${props.payload.metric}`,
                    'Best set',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#4FB3A9"
                  strokeWidth={2}
                  dot={(props) => {
                    const isPR = maxWeight !== null && props.payload.weight === maxWeight
                    return (
                      <Dot
                        key={`dot-${props.payload.date}`}
                        cx={props.cx}
                        cy={props.cy}
                        r={isPR ? 5 : 3}
                        fill={isPR ? '#D8A13F' : '#4FB3A9'}
                        stroke={isPR ? '#D8A13F' : '#4FB3A9'}
                      />
                    )
                  }}
                  activeDot={{ r: 5, fill: '#4FB3A9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}
