import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { runZScore, runIsolationForest, runCompare } from '../api/analysis'
import { useStore } from '../store/useStore'
import Footer from '../components/Footer'

type Tab = 'zscore' | 'isolation'

export default function AnomalyPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('zscore')
  const [showCompare, setShowCompare] = useState(false)

  const {
    parameters, age, sex,
    zscoreResult, isolationForestResult, compareResult,
    setZscoreResult, setIsolationForestResult, setCompareResult,
  } = useStore()

  const paramInputs = parameters.map((p) => ({ name: p.name, value: p.value, unit: p.unit }))
  const base = { parameters: paramInputs, age, sex }

  const zscoreMutation = useMutation({
    mutationFn: () => runZScore(base),
    onSuccess: (res) => { if (res.data) setZscoreResult(res.data) },
  })

  const ifMutation = useMutation({
    mutationFn: () => runIsolationForest(base),
    onSuccess: (res) => { if (res.data) setIsolationForestResult(res.data) },
  })

  const compareMutation = useMutation({
    mutationFn: () => runCompare(base),
    onSuccess: (res) => { if (res.data) { setCompareResult(res.data); setShowCompare(true) } },
  })

  // Auto-run Z-score on mount when parameters are available
  useEffect(() => {
    if (parameters.length > 0 && !zscoreResult) {
      zscoreMutation.mutate()
    }
  }, [parameters])

  const handleTabChange = (t: Tab) => {
    setTab(t)
    if (t === 'zscore' && !zscoreResult) zscoreMutation.mutate()
    if (t === 'isolation' && !isolationForestResult) ifMutation.mutate()
  }

  const scores = zscoreResult?.scores ?? {}
  const summary = zscoreResult?.summary
  const sortedScores = Object.entries(scores).sort(([, a], [, b]) => Math.abs(b.z_score) - Math.abs(a.z_score))

  const getBarWidth = (z: number) => `${Math.min(Math.abs(z) / 3, 1) * 50}%`
  const isHigh = (z: number) => z > 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="pt-12 px-12 mb-16 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tighter font-headline uppercase">
            Anomaly Detection
          </h2>
          {summary && (
            <div className="flex items-center gap-4 mt-2">
              <span className={`font-mono text-[10px] uppercase tracking-widest ${summary.has_critical ? 'text-[#B84040]' : 'text-tertiary'}`}>
                {summary.has_critical ? 'Critical values present' : 'Both methods running'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => compareMutation.mutate()}
          disabled={compareMutation.isPending}
          className="bg-[#B84040] text-on-primary-container px-6 py-3 font-mono text-xs font-bold tracking-widest hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-50"
        >
          {compareMutation.isPending ? 'COMPARING...' : 'Compare Both Methods'}
        </button>
      </header>

      {/* Stats */}
      {summary && (
        <section className="px-12 mb-12">
          <div className="grid grid-cols-3 bg-surface-container-low border-b border-outline-variant/10">
            <div className="p-8 border-r border-outline-variant/10">
              <p className="font-mono text-[10px] text-neutral-500 tracking-widest mb-1">TOTAL PARAMETERS</p>
              <p className="font-mono text-3xl font-bold">{String(summary.total_parameters).padStart(2, '0')}</p>
            </div>
            <div className="p-8 border-r border-outline-variant/10">
              <p className="font-mono text-[10px] text-neutral-500 tracking-widest mb-1">ANOMALY COUNT</p>
              <p className="font-mono text-3xl font-bold text-secondary">{String(summary.anomaly_count).padStart(2, '0')}</p>
            </div>
            <div className="p-8">
              <p className="font-mono text-[10px] text-neutral-500 tracking-widest mb-1">SEVERE COUNT</p>
              <p className="font-mono text-3xl font-bold text-[#B84040]">{String(summary.severe_count).padStart(2, '0')}</p>
            </div>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="px-12 flex gap-12 border-b border-outline-variant/10 mb-12">
        <button
          onClick={() => handleTabChange('zscore')}
          className={`pb-4 font-mono text-xs tracking-[0.2em] border-b-2 transition-colors ${tab === 'zscore' ? 'border-[#B84040] text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
        >
          Z-SCORE ANALYSIS
        </button>
        <button
          onClick={() => handleTabChange('isolation')}
          className={`pb-4 font-mono text-xs tracking-[0.2em] border-b-2 transition-colors ${tab === 'isolation' ? 'border-[#B84040] text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
        >
          ISOLATION FOREST
        </button>
      </div>

      {/* Content */}
      <section className="px-12 grid grid-cols-12 gap-16 pb-24">
        <div className="col-span-8 space-y-6">
          {tab === 'zscore' && (
            <>
              {zscoreMutation.isPending && (
                <p className="font-mono text-sm text-neutral-500">Running Z-Score analysis...</p>
              )}
              {sortedScores.length > 0 && (
                <>
                  <div className="flex justify-between items-end font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                    <span>PARAMETER NAME</span>
                    <div className="flex gap-20 pr-4">
                      <span>DEVIATION (-3 TO +3)</span>
                      <span>Z-VAL</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {sortedScores.map(([name, score]) => {
                      const high = isHigh(score.z_score)
                      const color = Math.abs(score.z_score) < 1 ? 'bg-neutral-500' : high ? 'bg-[#B84040]' : 'bg-secondary'
                      const textColor = Math.abs(score.z_score) < 1 ? 'text-neutral-500' : high ? 'text-[#B84040]' : 'text-secondary'
                      return (
                        <div key={name} className="flex items-center justify-between bg-surface-container-low p-4 hover:bg-surface-container-high transition-colors">
                          <span className="font-mono text-xs font-bold w-48 truncate uppercase">{name}</span>
                          <div className="flex-1 px-12 relative flex items-center h-8">
                            <div className="absolute left-1/2 w-px h-full bg-outline-variant/30" />
                            <div className="relative w-full h-1 bg-neutral-800/50">
                              {high ? (
                                <div
                                  className={`absolute left-1/2 h-full ${color}`}
                                  style={{ width: getBarWidth(score.z_score) }}
                                />
                              ) : (
                                <div
                                  className={`absolute right-1/2 h-full ${color}`}
                                  style={{ width: getBarWidth(score.z_score) }}
                                />
                              )}
                            </div>
                          </div>
                          <span className={`font-mono text-xs font-bold ${textColor} w-16 text-right`}>
                            {score.z_score > 0 ? '+' : ''}{score.z_score.toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'isolation' && (
            <div className="space-y-8">
              {ifMutation.isPending && (
                <p className="font-mono text-sm text-neutral-500">Running Isolation Forest...</p>
              )}
              {isolationForestResult && (
                <>
                  <div className="flex items-center gap-12 p-12 bg-surface-container-low">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#2a2a2d" strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={isolationForestResult.is_anomalous ? '#B84040' : '#7cd7c2'}
                          strokeDasharray={`${Math.max(0, (isolationForestResult.anomaly_score + 1) / 2 * 100)}, 100`}
                          strokeWidth="2"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold">
                        {isolationForestResult.anomaly_score.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <p className={`font-mono text-2xl font-black uppercase ${isolationForestResult.is_anomalous ? 'text-[#B84040]' : 'text-tertiary'}`}>
                        {isolationForestResult.is_anomalous ? 'ANOMALOUS' : 'NORMAL'}
                      </p>
                      <p className="font-mono text-[10px] text-neutral-500 tracking-wider mt-1">
                        CONFIDENCE: {isolationForestResult.confidence.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="border border-outline-variant/20 p-8">
                    <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-3">Technical Note</p>
                    <p className="text-xs font-body leading-relaxed text-neutral-400">
                      Score ranges from -1 (anomalous) to +1 (normal). The Isolation Forest targets non-linear
                      multivariate correlations that traditional range-based methods miss.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Compare panel */}
          {showCompare && compareResult && (
            <div className="bg-surface-container-low p-8 border-l-4 border-tertiary mt-8">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-mono text-sm font-bold tracking-widest uppercase">
                  Method Comparison
                </h3>
                <span className={`px-4 py-2 font-mono text-[10px] font-bold tracking-widest ${compareResult.agreement ? 'bg-tertiary/10 text-tertiary' : 'bg-[#B84040]/10 text-[#B84040]'}`}>
                  {compareResult.agreement ? 'AGREE' : 'DISAGREE'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="font-mono text-[10px] text-neutral-500 mb-2">Z-SCORE: {compareResult.zscore.summary.anomaly_count} anomalies</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-neutral-500 mb-2">
                    ISOLATION FOREST: {compareResult.isolation_forest.is_anomalous ? 'Anomalous' : 'Normal'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right gutter */}
        <aside className="col-span-4 sticky top-12 self-start space-y-8">
          <div className="bg-surface-container-low p-8 space-y-6">
            <span className="font-mono text-[10px] text-[#B84040] font-bold tracking-[0.3em] uppercase block">
              What Does This Mean?
            </span>

            {tab === 'zscore' ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-neutral-200">Z-Score Analysis</p>
                <p className="text-xs font-body leading-relaxed text-neutral-400">
                  Think of this like a ruler that measures how far each of your blood values is from a healthy average.
                </p>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-xs text-neutral-400">
                    <span className="text-tertiary font-mono mt-0.5">0</span>
                    <span>Exactly average — perfectly normal.</span>
                  </li>
                  <li className="flex gap-3 text-xs text-neutral-400">
                    <span className="text-tertiary font-mono mt-0.5">±1</span>
                    <span>Slightly above or below average — still well within normal.</span>
                  </li>
                  <li className="flex gap-3 text-xs text-neutral-400">
                    <span className="text-secondary font-mono mt-0.5">±2</span>
                    <span>Noticeably different from average — worth monitoring.</span>
                  </li>
                  <li className="flex gap-3 text-xs text-neutral-400">
                    <span className="text-[#B84040] font-mono mt-0.5">±3</span>
                    <span>Significantly outside the normal range — consider consulting a doctor.</span>
                  </li>
                </ul>
                <p className="text-xs font-body leading-relaxed text-neutral-500 border-t border-outline-variant/10 pt-4">
                  Bars extending to the right (red) mean a value is higher than normal. Bars to the left (blue) mean lower than normal.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-neutral-200">Isolation Forest</p>
                <p className="text-xs font-body leading-relaxed text-neutral-400">
                  Instead of looking at each value individually, this method looks at all your blood values together as a pattern — the way a doctor reviews the full picture.
                </p>
                <p className="text-xs font-body leading-relaxed text-neutral-400">
                  It asks: does your overall combination of results look like a healthy person? Sometimes individual values seem fine but together they form an unusual pattern.
                </p>
                <div className="space-y-2 border-t border-outline-variant/10 pt-4">
                  <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Score Guide</p>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Near +1.0</span>
                    <span className="text-tertiary">Normal pattern</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Near -1.0</span>
                    <span className="text-[#B84040]">Unusual pattern</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/risk')}
            className="w-full bg-[#B84040] text-white py-4 font-mono text-xs uppercase tracking-widest hover:bg-on-primary-fixed-variant transition-colors"
          >
            Next: Check Risk
          </button>
        </aside>
      </section>

      <Footer />
    </div>
  )
}
