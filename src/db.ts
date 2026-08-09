import Dexie, { type EntityTable } from 'dexie'
import type { Workout, WorkoutSet } from './types'

// Grip Tracker's local-only database. Everything lives in IndexedDB on
// device — no backend, no sync. Future modules (e.g. climbing route/photo
// tracking) should add their own tables here rather than reusing these.
class GripTrackerDB extends Dexie {
  workouts!: EntityTable<Workout, 'id'>
  workoutSets!: EntityTable<WorkoutSet, 'id'>

  constructor() {
    super('GripTrackerDB')

    this.version(1).stores({
      workouts: '++id, date',
      // *fingers is a multi-entry index so a set can be found by any one
      // of the fingers engaged in it.
      workoutSets: '++id, workoutId, exerciseType, handSide, *fingers',
    })
  }
}

export const db = new GripTrackerDB()

/** Delete a workout and all of its sets in one transaction. */
export async function deleteWorkoutCascade(workoutId: number): Promise<void> {
  await db.transaction('rw', db.workouts, db.workoutSets, async () => {
    await db.workoutSets.where('workoutId').equals(workoutId).delete()
    await db.workouts.delete(workoutId)
  })
}
