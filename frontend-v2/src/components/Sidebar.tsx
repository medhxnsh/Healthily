import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Upload', path: '/upload' },
  { label: 'My Report', path: '/report' },
  { label: 'Anomalies', path: '/anomalies' },
  { label: 'Risk Check', path: '/risk' },
  { label: 'ML Prediction', path: '/prediction' },
]

export default function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 h-full w-[200px] bg-[#131316] flex flex-col py-12 z-50">
      <div className="px-4 mb-10">
        <h1 className="font-['Inter'] font-black tracking-tighter text-[#B84040] text-xl">
          HEALTHIFY
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
          Blood Report Analysis
        </p>
      </div>

      <div className="flex flex-col flex-1">
        {NAV_ITEMS.map(({ label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              isActive
                ? 'font-mono uppercase tracking-widest text-[12px] text-white border-l-2 border-[#B84040] pl-4 py-3 bg-surface-container-low transition-all duration-75'
                : 'font-mono uppercase tracking-widest text-[12px] text-neutral-500 pl-4 py-3 hover:text-neutral-300 hover:bg-surface-container-high transition-all duration-150'
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      <footer className="px-4 mt-auto">
        <p className="font-mono italic text-[9px] uppercase tracking-tight text-neutral-700">
          Healthify — for informational use only
        </p>
      </footer>
    </nav>
  )
}
