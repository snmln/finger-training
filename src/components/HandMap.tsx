import type { Finger, HandSide } from '../types'

interface FingerSpec {
  finger: Finger
  label: string
  /** Center-x of the finger capsule in the base (right-hand) coordinate space. */
  cx: number
  /** Top-y of the finger capsule — smaller means a longer finger. */
  top: number
}

// Base layout is drawn as a right hand, palm-facing-viewer. Left hand is
// produced by mirroring the whole group horizontally.
const PALM_TOP = 172
const FINGER_WIDTH = 30
const FINGERS: FingerSpec[] = [
  { finger: 'index', label: 'Index', cx: 78, top: 74 },
  { finger: 'middle', label: 'Middle', cx: 110, top: 46 },
  { finger: 'ring', label: 'Ring', cx: 142, top: 66 },
  { finger: 'pinky', label: 'Pinky', cx: 174, top: 104 },
]

interface HandMapProps {
  handSide: HandSide
  selectedFingers: Finger[]
  onToggleFinger: (finger: Finger) => void
  className?: string
}

export default function HandMap({
  handSide,
  selectedFingers,
  onToggleFinger,
  className = '',
}: HandMapProps) {
  const isSelected = (finger: Finger) => selectedFingers.includes(finger)

  const handleActivate = (finger: Finger) => onToggleFinger(finger)

  const handleKeyDown = (event: React.KeyboardEvent, finger: Finger) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleActivate(finger)
    }
  }

  return (
    <svg
      viewBox="0 0 252 300"
      className={`h-auto w-full max-w-xs ${className}`}
      role="group"
      aria-label={`${handSide === 'left' ? 'Left' : 'Right'} hand, select fingers`}
    >
      {/* Mirror the whole diagram for the left hand */}
      <g transform={handSide === 'left' ? 'scale(-1,1) translate(-252,0)' : undefined}>
        {/* Topo-map style contour lines inside the palm, decorative */}
        <g stroke="#4FB3A9" strokeOpacity="0.12" fill="none">
          <ellipse cx="126" cy="235" rx="70" ry="52" />
          <ellipse cx="126" cy="235" rx="50" ry="36" />
          <ellipse cx="126" cy="235" rx="30" ry="20" />
        </g>

        {/* Palm */}
        <rect
          x="46"
          y={PALM_TOP}
          width="160"
          height="120"
          rx="34"
          className="fill-basalt-surface stroke-basalt-light"
          strokeWidth="1.5"
        />

        {/* Thumb */}
        <g
          role="button"
          tabIndex={0}
          aria-pressed={isSelected('thumb')}
          aria-label="Thumb"
          onClick={() => handleActivate('thumb')}
          onKeyDown={(e) => handleKeyDown(e, 'thumb')}
          className="cursor-pointer outline-none"
        >
          <rect
            x="8"
            y="188"
            width="34"
            height="92"
            rx="17"
            transform="rotate(-38 25 234)"
            className={
              isSelected('thumb')
                ? 'fill-tape stroke-tape'
                : 'fill-basalt-light stroke-basalt-light transition-colors hover:fill-basalt-light/70'
            }
            strokeWidth="1.5"
          />
        </g>

        {/* Fingers */}
        {FINGERS.map(({ finger, cx, top }) => {
          const selected = isSelected(finger)
          return (
            <g
              key={finger}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={finger}
              onClick={() => handleActivate(finger)}
              onKeyDown={(e) => handleKeyDown(e, finger)}
              className="cursor-pointer outline-none"
            >
              <rect
                x={cx - FINGER_WIDTH / 2}
                y={top}
                width={FINGER_WIDTH}
                height={PALM_TOP - top + 14}
                rx={FINGER_WIDTH / 2}
                className={
                  selected
                    ? 'fill-tape stroke-tape'
                    : 'fill-basalt-light stroke-basalt-light transition-colors hover:fill-basalt-light/70'
                }
                strokeWidth="1.5"
              />
            </g>
          )
        })}

        {/* Labels rendered in an un-mirrored overlay group so text stays legible */}
      </g>

      {/* Finger labels — separate pass so text glyphs never get mirrored */}
      {FINGERS.map(({ finger, label, cx, top }) => {
        const labelX = handSide === 'left' ? 252 - cx : cx
        return (
          <text
            key={finger}
            x={labelX}
            y={top - 8}
            textAnchor="middle"
            className={`select-none font-mono text-[10px] ${
              isSelected(finger) ? 'fill-tape' : 'fill-chalk/40'
            }`}
          >
            {label}
          </text>
        )
      })}
      <text
        x={handSide === 'left' ? 252 - 25 : 25}
        y={172}
        textAnchor="middle"
        className={`select-none font-mono text-[10px] ${
          isSelected('thumb') ? 'fill-tape' : 'fill-chalk/40'
        }`}
      >
        Thumb
      </text>
    </svg>
  )
}
