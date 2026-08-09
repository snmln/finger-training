import { useState } from 'react'
import { db } from '../../db'
import HandMap from '../../components/HandMap'
import { entrySummary, fingerLabel, surfaceLabel, techniqueLabel, todayLocalISODate } from './format'
import {
  EXERCISE_TYPES,
  GRIP_TECHNIQUES,
  GRIP_TOOLS,
  isPinchSurface,
  type ExerciseType,
  type Finger,
  type GripSurface,
  type GripTechnique,
  type GripToolId,
  type HandSide,
} from '../../types'

type SurfaceMode = 'tool' | 'custom'

interface DraftSet {
  exerciseType: ExerciseType
  handSide: HandSide
  selectedFingers: Finger[]
  surfaceMode: SurfaceMode
  toolId: GripToolId
  positionId: string
  customSurfaceType: 'crimp' | 'pinch'
  customSizeMm: string
  gripTechnique: GripTechnique
  weight: string
  reps: string
  durationSeconds: string
}

function freshDraft(
  carry?: Pick<DraftSet, 'exerciseType' | 'handSide' | 'surfaceMode' | 'toolId' | 'positionId'>,
): DraftSet {
  const toolId = carry?.toolId ?? GRIP_TOOLS[0].id
  const tool = GRIP_TOOLS.find((t) => t.id === toolId) ?? GRIP_TOOLS[0]
  return {
    exerciseType: carry?.exerciseType ?? 'timed-hold',
    handSide: carry?.handSide ?? 'right',
    selectedFingers: [],
    surfaceMode: carry?.surfaceMode ?? 'tool',
    toolId,
    positionId: carry?.positionId ?? tool.positions[0].id,
    customSurfaceType: 'crimp',
    customSizeMm: '',
    gripTechnique: 'half-crimp',
    weight: '',
    reps: '',
    durationSeconds: '',
  }
}

function draftGripSurface(d: DraftSet): GripSurface {
  return d.surfaceMode === 'custom'
    ? { kind: 'custom', surfaceType: d.customSurfaceType, sizeMm: Number(d.customSizeMm) || 0 }
    : { kind: 'tool', tool: d.toolId, position: d.positionId }
}

interface PendingSet {
  key: string
  exerciseType: ExerciseType
  handSide: HandSide
  fingers: Finger[]
  gripSurface: GripSurface
  gripTechnique?: GripTechnique
  weight: number
  reps?: number
  durationSeconds?: number
}

function summarizeSet(set: PendingSet): string {
  const side = set.handSide === 'left' ? 'Left' : 'Right'
  const fingers = set.fingers.map(fingerLabel).join('+')
  const technique = set.gripTechnique ? ` · ${techniqueLabel(set.gripTechnique)}` : ''
  return `${side} · ${fingers} · ${surfaceLabel(set.gripSurface)}${technique} — ${entrySummary(set)}`
}

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? 'border-tape bg-tape/15 text-tape'
              : 'border-basalt-light text-chalk/60 hover:border-chalk/30 hover:text-chalk'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-basalt-light bg-basalt p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value ? 'bg-tape text-basalt' : 'text-chalk/60 hover:text-chalk'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-basalt-light bg-basalt px-3 py-2 font-mono text-sm text-chalk placeholder:text-chalk/30 focus:border-tape focus:outline-none'

const sectionLabelClass = 'mb-1.5 text-xs font-medium text-chalk/50'

export default function WorkoutForm() {
  const [date, setDate] = useState(() => todayLocalISODate())
  const [notes, setNotes] = useState('')
  const [pendingSets, setPendingSets] = useState<PendingSet[]>([])
  const [draft, setDraft] = useState<DraftSet>(() => freshDraft())
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const toggleFinger = (finger: Finger) => {
    setDraft((d) => ({
      ...d,
      selectedFingers: d.selectedFingers.includes(finger)
        ? d.selectedFingers.filter((f) => f !== finger)
        : [...d.selectedFingers, finger],
    }))
  }

  const selectedTool = GRIP_TOOLS.find((t) => t.id === draft.toolId) ?? GRIP_TOOLS[0]
  const gripSurface = draftGripSurface(draft)
  const isPinch = isPinchSurface(gripSurface, GRIP_TOOLS)

  const canAddSet =
    draft.selectedFingers.length > 0 &&
    (draft.surfaceMode === 'tool' || Number(draft.customSizeMm) > 0) &&
    (draft.exerciseType === 'timed-hold' ? Number(draft.durationSeconds) > 0 : Number(draft.reps) > 0)

  const handleAddSet = () => {
    if (!canAddSet) return

    const pending: PendingSet = {
      key: crypto.randomUUID(),
      exerciseType: draft.exerciseType,
      handSide: draft.handSide,
      fingers: draft.selectedFingers,
      gripSurface,
      gripTechnique: isPinch ? undefined : draft.gripTechnique,
      weight: Number(draft.weight) || 0,
      ...(draft.exerciseType === 'timed-hold'
        ? { durationSeconds: Number(draft.durationSeconds) || 0 }
        : { reps: Number(draft.reps) || 0 }),
    }

    setPendingSets((sets) => [...sets, pending])
    setDraft(
      freshDraft({
        exerciseType: draft.exerciseType,
        handSide: draft.handSide,
        surfaceMode: draft.surfaceMode,
        toolId: draft.toolId,
        positionId: draft.positionId,
      }),
    )
  }

  const removeSet = (key: string) => setPendingSets((sets) => sets.filter((s) => s.key !== key))

  const handleSaveWorkout = async () => {
    if (pendingSets.length === 0 || saving) return
    setSaving(true)
    try {
      await db.transaction('rw', db.workouts, db.workoutSets, async () => {
        const workoutId = (await db.workouts.add({ date, notes })) as number
        await db.workoutSets.bulkAdd(
          pendingSets.map(({ key: _key, ...set }) => ({ ...set, workoutId })),
        )
      })
      const count = pendingSets.length
      setPendingSets([])
      setNotes('')
      setDraft(freshDraft())
      setSavedMessage(`Workout saved — ${count} set${count === 1 ? '' : 's'} logged.`)
      setTimeout(() => setSavedMessage(null), 3500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {savedMessage && (
        <div className="rounded-lg border border-tape/30 bg-tape/10 px-3 py-2 text-sm text-tape">
          {savedMessage}
        </div>
      )}

      <section className="rounded-xl border border-basalt-light bg-basalt-surface p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-chalk/60">
          Workout
        </h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-chalk/60">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-chalk/60">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Session notes, conditions, how it felt..."
              rows={2}
              className={`${inputClass} font-body`}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-basalt-light bg-basalt-surface p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-chalk/60">
          Add a Set
        </h2>

        <div className="flex flex-col gap-4">
          {/* 1. Exercise type */}
          <div>
            <p className={sectionLabelClass}>Exercise type</p>
            <SegmentedControl
              options={EXERCISE_TYPES}
              value={draft.exerciseType}
              onChange={(exerciseType) => setDraft((d) => ({ ...d, exerciseType }))}
            />
          </div>

          {/* 2. Hand side */}
          <div>
            <p className={sectionLabelClass}>Hand</p>
            <SegmentedControl
              options={[
                { value: 'right' as const, label: 'Right' },
                { value: 'left' as const, label: 'Left' },
              ]}
              value={draft.handSide}
              onChange={(handSide) => setDraft((d) => ({ ...d, handSide }))}
            />
          </div>

          {/* 3. Fingers */}
          <div className="flex flex-col items-center gap-2">
            <p className={`${sectionLabelClass} self-start`}>Fingers</p>
            <HandMap
              handSide={draft.handSide}
              selectedFingers={draft.selectedFingers}
              onToggleFinger={toggleFinger}
            />
            <p className="text-sm text-chalk/40">
              {draft.selectedFingers.length === 0
                ? 'Tap fingers on the hand to select them.'
                : `Selected: ${draft.selectedFingers.map(fingerLabel).join(', ')}`}
            </p>
          </div>

          {/* 4. Grip surface: tool + position, or custom mm */}
          <div>
            <p className={sectionLabelClass}>Grip surface</p>
            <div className="mb-2">
              <SegmentedControl
                options={[
                  { value: 'tool' as const, label: 'Training Tool' },
                  { value: 'custom' as const, label: 'Custom mm' },
                ]}
                value={draft.surfaceMode}
                onChange={(surfaceMode) => setDraft((d) => ({ ...d, surfaceMode }))}
              />
            </div>

            {draft.surfaceMode === 'tool' ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-basalt-light bg-basalt p-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-chalk/40">
                    Tool
                  </p>
                  <ChipGroup
                    options={GRIP_TOOLS.map((t) => ({ value: t.id, label: t.label }))}
                    value={draft.toolId}
                    onChange={(toolId) => {
                      const tool = GRIP_TOOLS.find((t) => t.id === toolId) ?? GRIP_TOOLS[0]
                      setDraft((d) => ({ ...d, toolId, positionId: tool.positions[0].id }))
                    }}
                  />
                </div>
                <div className="rounded-lg border border-basalt-light bg-basalt p-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-chalk/40">
                    Edge / position on {selectedTool.label}
                  </p>
                  <ChipGroup
                    options={selectedTool.positions.map((p) => ({ value: p.id, label: p.label }))}
                    value={draft.positionId}
                    onChange={(positionId) => setDraft((d) => ({ ...d, positionId }))}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <SegmentedControl
                  options={[
                    { value: 'crimp' as const, label: 'Crimp' },
                    { value: 'pinch' as const, label: 'Pinch' },
                  ]}
                  value={draft.customSurfaceType}
                  onChange={(customSurfaceType) => setDraft((d) => ({ ...d, customSurfaceType }))}
                />
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-chalk/60">Edge depth (mm)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    placeholder="20"
                    value={draft.customSizeMm}
                    onChange={(e) => setDraft((d) => ({ ...d, customSizeMm: e.target.value }))}
                    className={`${inputClass} max-w-[8rem]`}
                  />
                </label>
              </div>
            )}
          </div>

          {/* 5. Grip technique — not applicable to pinches */}
          {!isPinch && (
            <div>
              <p className={sectionLabelClass}>Grip technique</p>
              <ChipGroup
                options={GRIP_TECHNIQUES}
                value={draft.gripTechnique}
                onChange={(gripTechnique) => setDraft((d) => ({ ...d, gripTechnique }))}
              />
            </div>
          )}

          {/* 6. Entry: weight + duration, or weight + reps */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-chalk/60">Added weight (lb)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                placeholder="0"
                value={draft.weight}
                onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
                className={inputClass}
              />
            </label>
            {draft.exerciseType === 'timed-hold' ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-chalk/60">Duration (sec)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="10"
                  value={draft.durationSeconds}
                  onChange={(e) => setDraft((d) => ({ ...d, durationSeconds: e.target.value }))}
                  className={inputClass}
                />
              </label>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-chalk/60">Reps</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="6"
                  value={draft.reps}
                  onChange={(e) => setDraft((d) => ({ ...d, reps: e.target.value }))}
                  className={inputClass}
                />
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddSet}
            disabled={!canAddSet}
            className="rounded-lg bg-tape px-4 py-2.5 text-sm font-semibold text-basalt transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            Add Set
          </button>
        </div>
      </section>

      {pendingSets.length > 0 && (
        <section className="rounded-xl border border-basalt-light bg-basalt-surface p-4">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-chalk/60">
            Sets in this workout ({pendingSets.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {pendingSets.map((set) => (
              <li
                key={set.key}
                className="flex items-center justify-between gap-3 rounded-lg bg-basalt px-3 py-2"
              >
                <span className="font-mono text-xs text-chalk/80">{summarizeSet(set)}</span>
                <button
                  type="button"
                  onClick={() => removeSet(set.key)}
                  aria-label="Remove set"
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-crimson hover:bg-crimson/10"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        type="button"
        onClick={handleSaveWorkout}
        disabled={pendingSets.length === 0 || saving}
        className="rounded-lg border border-tape bg-tape/10 px-4 py-3 text-sm font-semibold text-tape transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
      >
        {saving ? 'Saving…' : 'Save Workout'}
      </button>
    </div>
  )
}
