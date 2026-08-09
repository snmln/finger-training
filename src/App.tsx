import { useState } from 'react'
import WorkoutForm from './features/finger-strength/WorkoutForm'
import History from './features/finger-strength/History'
import ProgressChart from './features/finger-strength/ProgressChart'

type Tab = 'log' | 'history' | 'progress'

const TABS: { id: Tab; label: string }[] = [
  { id: 'log', label: 'Log' },
  { id: 'history', label: 'History' },
  { id: 'progress', label: 'Progress' },
]

function TabIcon({ tab }: { tab: Tab }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (tab === 'log') {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  }
  if (tab === 'history') {
    return (
      <svg {...common}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-7 3L3 8" />
        <path d="M3 4v4h4M12 7v5l3 3" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M4 19V10M11 19V5M18 19v-7" />
    </svg>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('log')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-basalt-light bg-basalt/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-4">
          <div className="h-2.5 w-2.5 rounded-full bg-tape" aria-hidden="true" />
          <h1 className="font-display text-lg font-semibold tracking-tight text-chalk">
            Grip Tracker
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-4">
        {activeTab === 'log' && <WorkoutForm />}
        {activeTab === 'history' && <History />}
        {activeTab === 'progress' && <ProgressChart />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-basalt-light bg-basalt-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-tape' : 'text-chalk/50 hover:text-chalk/80'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <TabIcon tab={tab.id} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
