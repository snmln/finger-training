// Core domain types for the finger-strength training module.
//
// NOTE: Climbing route/photo tracking (ClimbSession, Route, Attempt) is a
// planned future module. It will live as its own set of entities and its
// own Dexie table(s) — deliberately NOT merged into the WorkoutSet schema
// below, so the two feature areas can evolve independently.

// A set is logged in this order: exercise type -> hand side -> fingers ->
// grip surface (tool + position, or a custom mm size) -> grip technique
// (skipped for pinches) -> the reps/weight or weight/duration for the set.

export type ExerciseType = 'timed-hold' | 'rep-based'

export type HandSide = 'left' | 'right'

export type Finger = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'

/** Hand shape used on an edge. Not meaningful for pinch grips. */
export type GripTechnique = 'half-crimp' | 'full-crimp' | 'open-hand' | 'three-finger-drag'

export type GripToolId =
  | 'beastmaker-1000'
  | 'beastmaker-2000'
  | 'tension-block'
  | 'so-ill-sport-board'
  | 'metolius-project-hold'

export interface GripToolPosition {
  id: string
  label: string
}

export interface GripToolDef {
  id: GripToolId
  label: string
  positions: GripToolPosition[]
}

/**
 * What the fingers are actually gripping: either a named position on a
 * predefined training tool, or a custom crimp/pinch defined by raw edge
 * depth in millimeters.
 */
export type GripSurface =
  | { kind: 'tool'; tool: GripToolId; position: string }
  | { kind: 'custom'; surfaceType: 'crimp' | 'pinch'; sizeMm: number }

export function isPinchSurface(surface: GripSurface, tools: GripToolDef[]): boolean {
  if (surface.kind === 'custom') return surface.surfaceType === 'pinch'
  const tool = tools.find((t) => t.id === surface.tool)
  const position = tool?.positions.find((p) => p.id === surface.position)
  return position?.id === 'pinch'
}

export interface Workout {
  id?: number
  date: string // ISO 8601 date string, e.g. "2026-08-05"
  notes: string
}

export interface WorkoutSet {
  id?: number
  workoutId: number
  exerciseType: ExerciseType
  handSide: HandSide
  /** Which fingers are engaged for this set (thumb included, for pinches). */
  fingers: Finger[]
  gripSurface: GripSurface
  /** Omitted when gripSurface resolves to a pinch. */
  gripTechnique?: GripTechnique
  weight: number // added weight in lbs, can be negative for assisted
  reps?: number // present when exerciseType === 'rep-based'
  durationSeconds?: number // present when exerciseType === 'timed-hold'
}

export const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
  { value: 'timed-hold', label: 'Timed Hold' },
  { value: 'rep-based', label: 'Rep-Based' },
]

export const GRIP_TECHNIQUES: { value: GripTechnique; label: string }[] = [
  { value: 'half-crimp', label: 'Half Crimp' },
  { value: 'full-crimp', label: 'Full Crimp' },
  { value: 'open-hand', label: 'Open Hand' },
  { value: 'three-finger-drag', label: 'Three-Finger Drag' },
]

export const FINGERS: { value: Finger; label: string }[] = [
  { value: 'thumb', label: 'Thumb' },
  { value: 'index', label: 'Index' },
  { value: 'middle', label: 'Middle' },
  { value: 'ring', label: 'Ring' },
  { value: 'pinky', label: 'Pinky' },
]

// Approximate, representative edge depths / hold names for well-known
// training tools — good enough for logging and progress tracking, not
// sourced from official spec sheets. "Custom" in the UI covers anything
// that doesn't match.
export const GRIP_TOOLS: GripToolDef[] = [
  {
    id: 'beastmaker-1000',
    label: 'Beastmaker 1000',
    positions: [
      { id: 'jug', label: 'Jug' },
      { id: '35mm', label: '35mm Edge' },
      { id: '25mm', label: '25mm Edge' },
      { id: '20mm', label: '20mm Edge' },
      { id: '15mm', label: '15mm Edge' },
      { id: 'two-finger-pocket', label: '2-Finger Pocket' },
      { id: 'mono', label: 'Mono Pocket' },
      { id: 'sloper', label: 'Sloper' },
      { id: 'pinch', label: 'Pinch' },
    ],
  },
  {
    id: 'beastmaker-2000',
    label: 'Beastmaker 2000',
    positions: [
      { id: 'jug', label: 'Jug' },
      { id: '40mm', label: '40mm Edge' },
      { id: '30mm', label: '30mm Edge' },
      { id: '20mm', label: '20mm Edge' },
      { id: '15mm', label: '15mm Edge' },
      { id: 'incut-pocket', label: 'Incut Pocket' },
      { id: 'pinch', label: 'Pinch' },
    ],
  },
  {
    id: 'tension-block',
    label: 'Tension Block',
    positions: [
      { id: '30mm', label: '30mm Edge' },
      { id: '25mm', label: '25mm Edge' },
      { id: '20mm', label: '20mm Edge' },
      { id: '15mm', label: '15mm Edge' },
      { id: '10mm', label: '10mm Edge' },
      { id: 'mono', label: 'Mono Pocket' },
      { id: 'pinch', label: 'Pinch' },
    ],
  },
  {
    id: 'so-ill-sport-board',
    label: 'So iLL Sport Board',
    positions: [
      { id: 'jug', label: 'Jug' },
      { id: '30mm', label: '30mm Edge' },
      { id: '20mm', label: '20mm Edge' },
      { id: '15mm', label: '15mm Edge' },
      { id: 'pocket', label: 'Pocket' },
      { id: 'pinch', label: 'Pinch' },
    ],
  },
  {
    id: 'metolius-project-hold',
    label: 'Metolius Project Hold',
    positions: [
      { id: 'jug', label: 'Jug' },
      { id: '40mm', label: '40mm Edge' },
      { id: '30mm', label: '30mm Edge' },
      { id: '20mm', label: '20mm Edge' },
      { id: 'mono', label: 'Mono Pocket' },
      { id: 'pinch', label: 'Pinch' },
    ],
  },
]
