# Grip Tracker

An installable, offline-first PWA for logging climbing finger and grip
strength training — hangboard sets, added weight, and progress over time.
Built as a portfolio piece.

Everything runs and stores data entirely on-device. There's no backend,
no accounts, and no network calls after the page first loads.

## Screenshots

_TODO: add screenshots of the Log, History, and Progress tabs here._

| Log | History | Progress |
| --- | --- | --- |
| _placeholder_ | _placeholder_ | _placeholder_ |

## Features

- **Log a workout** — date, notes, and any number of sets.
- **Set entry flow**: exercise type (timed hold / rep-based) → hand side →
  fingers (via a tappable SVG hand diagram) → grip surface → grip technique
  → weight + reps/duration.
- **Grip surface**: pick a training tool (Beastmaker 1000/2000, Tension
  Block, So iLL Sport Board, Metolius Project Hold) and a named edge/hold
  on it, or go fully custom with a raw mm depth marked as crimp or pinch.
- **History** — expandable list of past workouts and their sets, with
  cascading delete.
- **Progress** — a Recharts line chart of best weight per session,
  filterable by exercise type, grip technique, and finger, with the
  session PR called out in gold.
- **Installable PWA** — add to home screen, works offline via a
  Workbox-generated service worker.

## Stack

- React + TypeScript + Vite
- Tailwind CSS (custom "quarry / topo-map" design tokens — see
  `tailwind.config.js`)
- Dexie (IndexedDB wrapper) + `dexie-react-hooks` for live queries
- Recharts for the progress chart
- `vite-plugin-pwa` for the manifest + service worker

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. To build and sanity-check the production
bundle (including the service worker):

```bash
npm run build
npm run preview
```

`npm run build` also type-checks the whole project (`tsc -b`) before Vite
bundles it, so a broken build always means a broken type somewhere.

## Architecture notes

### Data model (`src/types.ts`, `src/db.ts`)

Two Dexie tables: `workouts` and `workoutSets`, related by
`workoutSets.workoutId`. A set's shape follows the logging flow in order:

```
exerciseType ('timed-hold' | 'rep-based')
  → handSide ('left' | 'right')
  → fingers (Finger[], via the HandMap — thumb included, for pinches)
  → gripSurface (a named tool + position, or a custom mm crimp/pinch)
  → gripTechnique (half-crimp / full-crimp / open-hand / three-finger-drag —
     omitted for pinches, since "crimp style" doesn't apply to a pinch)
  → weight + (reps or durationSeconds, depending on exerciseType)
```

Each set carries one shared reps/weight or weight/duration value for all
selected fingers — you hang a position once, you don't do different reps
per finger — rather than nesting a value per finger.

`GRIP_TOOLS` in `types.ts` is a small hardcoded catalog of well-known
hangboards and their named positions (edge depths, jugs, pockets,
pinches). These are representative, not sourced from official spec
sheets — good enough for logging and comparing your own sessions, not a
claim of precision. "Custom mm" bypasses the catalog entirely.

**Deliberately not built yet:** climbing route/photo tracking. It's a
planned future module (`ClimbSession` / `Route` / `Attempt`) that will get
its own Dexie table(s) rather than being merged into `WorkoutSet` — so the
two feature areas can evolve independently.

### Structure

```
src/
  types.ts              Domain types + the grip tool catalog
  db.ts                 Dexie schema + cascading delete helper
  components/
    HandMap.tsx          Tappable SVG hand diagram (multi-select fingers)
  features/finger-strength/
    WorkoutForm.tsx       Log tab — the set-building flow
    History.tsx           History tab — expandable past workouts
    ProgressChart.tsx      Progress tab — filterable Recharts line chart
    format.ts             Shared display/date formatting helpers
```

### Local persistence

`main.tsx` calls `navigator.storage.persist()` on load, asking the browser
not to evict IndexedDB data under storage pressure. It's best-effort — not
every browser grants it, and the app works the same either way.

In dev builds only (`import.meta.env.DEV`), `main.tsx` also exposes the
Dexie instance as `window.__gripTrackerDb` for quick console
inspection/seeding. This is stripped out of production builds.

## Design tokens

Defined in `tailwind.config.js`:

- **Colors**: `basalt` (bg), `basalt-surface` / `basalt-light` (panels),
  `chalk` (text), `tape` (primary accent), `pr` (personal records),
  `crimson` (warnings/deletes).
- **Fonts**: `font-display` (Space Grotesk), `font-body` (Inter),
  `font-mono` (IBM Plex Mono — used for all numeric data: reps, weight,
  duration).
