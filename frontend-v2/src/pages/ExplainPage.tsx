import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { runExplain } from '../api/analysis'
import { useStore } from '../store/useStore'
import Footer from '../components/Footer'

function formatFeature(f: string): string {
  return f.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function ExplainPage() {
  const { parameters, age, sex, predictResult, explainResult, setExplainResult } = useStore()

  const paramInputs = parameters.map((p) => ({ name: p.name, value: p.value, unit: p.unit }))

  const mutation = useMutation({
    mutationFn: () =>
      runExplain({
        parameters: paramInputs,
        age,
        sex,
        condition: predictResult?.ml_prediction?.top_condition ?? undefined,
      }),
    onSuccess: (res) => { if (res.data) setExplainResult(res.data) },
  })

  useEffect(() => {
    if (parameters.length > 0 && !explainResult) {
      mutation.mutate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const explanations = explainResult?.explanations ?? []
  const maxContribution = explanations.length > 0
    ? Math.max(...explanations.map((e) => Math.abs(e.contribution)))
    : 1

  return (
    <div className="min-h-screen p-12 flex flex-col gap-12">
      <header>
        <h2 className="text-4xl font-black tracking-tighter mb-2">Why This Result</h2>
        <p className="text-sm text-neutral-400 font-light">
          This shows which blood values had the biggest impact on your risk prediction.
        </p>
      </header>

      {/* Manual trigger if auto-run didn't fire */}
      {!mutation.isPending && !mutation.isError && !explainResult && (
        <button
          onClick={() => mutation.mutate()}
          className="self-start px-8 py-4 bg-[#B84040] text-white font-mono text-xs uppercase tracking-widest hover:bg-on-primary-fixed-variant transition-colors"
        >
          Generate Explanation
        </button>
      )}

      {/* Loading state */}
      {mutation.isPending && (
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 border border-[#B84040] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-neutral-500">Calculating...</p>
        </div>
      )}

      {/* Error state */}
      {mutation.isError && (
        <div className="max-w-lg space-y-4">
          <p className="font-mono text-sm text-[#B84040]">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Something went wrong while fetching the explanation.'}
          </p>
          <button
            onClick={() => mutation.mutate()}
            className="px-6 py-3 bg-[#B84040] text-white font-mono text-xs tracking-widest hover:bg-on-primary-fixed-variant transition-colors"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* Results */}
      {explainResult && explanations.length > 0 && (
        <section className="max-w-3xl space-y-12">
          <div>
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest block mb-2">
              Condition analyzed
            </span>
            <p className="text-xl font-bold tracking-tight">
              {explainResult.explained_condition}
            </p>
          </div>

          {/* SHAP bars */}
          <div className="space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-4">
              What drove this result
            </div>
            {explanations.map((contrib) => {
              const pct = (Math.abs(contrib.contribution) / maxContribution) * 100
              const positive = contrib.direction === 'positive'
              return (
                <div key={contrib.feature} className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-neutral-300">{formatFeature(contrib.feature)}</span>
                    <span className={positive ? 'text-[#B84040]' : 'text-secondary'}>
                      {positive ? '+' : '-'}{contrib.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-800 relative">
                    {positive ? (
                      <div className="absolute left-0 top-0 h-full bg-[#B84040]" style={{ width: `${pct}%` }} />
                    ) : (
                      <div className="absolute right-0 top-0 h-full bg-secondary" style={{ width: `${pct}%` }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ML prediction recap — top 3 */}
          {predictResult?.ml_prediction?.probabilities && (
            <div className="bg-surface-container-low p-8">
              <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest block mb-4">
                Prediction Breakdown
              </span>
              <div className="space-y-2">
                {predictResult.ml_prediction.probabilities
                  .slice()
                  .sort((a, b) => b.probability - a.probability)
                  .slice(0, 3)
                  .map((cp) => (
                    <div key={cp.condition} className="flex justify-between font-mono text-xs">
                      <span className="text-neutral-400">{cp.display_name}</span>
                      <span className="text-neutral-300 mono-num">{(cp.probability * 100).toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      <Footer />
    </div>
  )
}
