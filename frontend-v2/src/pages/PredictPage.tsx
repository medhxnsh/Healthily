import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { runPredict } from '../api/analysis'
import { useStore } from '../store/useStore'
import Footer from '../components/Footer'

export default function PredictPage() {
  const navigate = useNavigate()
  const { parameters, age, sex, selectedSymptoms, predictResult, setPredictResult } = useStore()

  const paramInputs = parameters.map((p) => ({ name: p.name, value: p.value, unit: p.unit }))

  const mutation = useMutation({
    mutationFn: () => runPredict({ parameters: paramInputs, symptoms: selectedSymptoms, age, sex }),
    onSuccess: (res) => { if (res.data) setPredictResult(res.data) },
  })

  // Auto-run prediction on mount when parameters are available
  useEffect(() => {
    if (parameters.length > 0 && !predictResult) {
      mutation.mutate()
    }
  }, [parameters])

  return (
    <div className="min-h-screen p-12 flex flex-col gap-16">
      <header>
        <span className="font-mono text-[#B84040] text-xs tracking-[0.3em] uppercase mb-2 block">
          ML vs Rule-Based Engine
        </span>
        <h2 className="text-4xl font-black tracking-tighter">ML Prediction</h2>
      </header>

      {/* Loading state */}
      {mutation.isPending && (
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 border border-[#B84040] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-neutral-500">Running models... This may take a few seconds</p>
        </div>
      )}

      {predictResult && (
        <section className="max-w-5xl space-y-12">
          {/* Agreement badge */}
          <div className="flex items-center gap-6">
            <span className={`px-4 py-2 font-mono text-[10px] font-bold tracking-widest uppercase ${predictResult.agreement ? 'bg-tertiary/10 text-tertiary' : 'bg-[#B84040]/10 text-[#B84040]'}`}>
              {predictResult.agreement ? 'METHODS AGREE' : 'METHODS DISAGREE'}
            </span>
            <span className={`px-4 py-2 font-mono text-[10px] font-bold tracking-widest uppercase ${predictResult.confidence === 'high' ? 'bg-tertiary/10 text-tertiary' : 'bg-neutral-800 text-neutral-400'}`}>
              {predictResult.confidence.toUpperCase()} CONFIDENCE
            </span>
          </div>

          {/* Side by side */}
          <div className="grid grid-cols-2 gap-8">
            {/* ML */}
            <div className="bg-surface-container-low p-8 space-y-4">
              <span className="font-mono text-[10px] text-[#B84040] uppercase tracking-widest">ML MODEL</span>
              <div className="space-y-3 mt-4">
                {predictResult.ml_prediction.probabilities
                  .slice()
                  .sort((a, b) => b.probability - a.probability)
                  .map((cp, i) => (
                    <div key={cp.condition} className={`space-y-1 ${i === 0 ? '' : 'opacity-70'}`}>
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-neutral-300">{cp.display_name}</span>
                        <span className={i === 0 ? 'text-[#B84040]' : 'text-neutral-500'}>
                          {(cp.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1 bg-neutral-800">
                        <div
                          className={`h-full ${i === 0 ? 'bg-[#B84040]' : 'bg-neutral-600'}`}
                          style={{ width: `${cp.probability * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Rule-based */}
            <div className="bg-surface-container-low p-8 flex flex-col justify-center">
              <span className="font-mono text-[10px] text-secondary uppercase tracking-widest mb-6">
                RULE-BASED ENGINE
              </span>
              {predictResult.rule_based.top_condition ? (
                <>
                  <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-2">
                    Top Condition
                  </p>
                  <p className="text-2xl font-black tracking-tight mb-4">
                    {predictResult.rule_based.top_condition}
                  </p>
                  <p className="mono-num text-4xl font-black text-[#B84040]">
                    {predictResult.rule_based.risk_percent}%
                  </p>
                  <p className="font-mono text-[10px] text-neutral-500 mt-2">RISK SCORE</p>
                </>
              ) : (
                <p className="text-neutral-500 font-mono text-sm">No conditions flagged.</p>
              )}
            </div>
          </div>

        </section>
      )}

      <Footer />
    </div>
  )
}
