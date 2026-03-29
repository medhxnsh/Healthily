import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getSymptoms, assessRisk } from '../api/risk'
import { useStore } from '../store/useStore'
import Footer from '../components/Footer'

function formatSymptom(s: string): string {
  return s
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function RiskPage() {
  const navigate = useNavigate()
  const { parameters, age, sex, selectedSymptoms, riskResult, toggleSymptom, setRiskResult } = useStore()

  const paramInputs = parameters.map((p) => ({ name: p.name, value: p.value, unit: p.unit }))

  const { data: symptomsRes } = useQuery({
    queryKey: ['symptoms'],
    queryFn: getSymptoms,
  })
  const symptoms = symptomsRes?.data ?? []

  const mutation = useMutation({
    mutationFn: () => assessRisk({ parameters: paramInputs, symptoms: selectedSymptoms, age, sex }),
    onSuccess: (res) => { if (res.data) setRiskResult(res.data) },
  })

  const getRingDash = (pct: number) => `${pct}, 100`
  const getRingColor = (sev: string) => {
    if (sev === 'critical' || sev === 'severe') return 'stroke-primary'
    if (sev === 'moderate') return 'stroke-secondary'
    return 'stroke-tertiary'
  }

  return (
    <div className="min-h-screen p-12 flex flex-col gap-16">
      <header className="max-w-5xl">
        <h2 className="text-4xl font-black tracking-tighter mb-4">Risk Check</h2>
        <div className="h-px w-24 bg-primary-container" />
      </header>

      {/* Symptom selector */}
      <section className="max-w-5xl bg-surface-container-low p-8">
        <h3 className="font-mono text-xs uppercase tracking-widest mb-2 text-neutral-400">
          Select Your Symptoms
        </h3>
        <p className="text-sm text-neutral-500 mb-6">
          Choose all symptoms you are currently experiencing. This helps us calculate your risk more accurately.
        </p>
        <div className="flex flex-wrap gap-3 mb-10">
          {symptoms.map((s) => {
            const active = selectedSymptoms.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`px-4 py-2 text-[10px] font-mono uppercase transition-all ${
                  active
                    ? 'bg-primary-container text-on-primary-container'
                    : 'border border-outline-variant/30 text-neutral-400 hover:bg-surface-container-high'
                }`}
              >
                {formatSymptom(s)}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="bg-[#B84040] text-white px-8 py-4 font-mono text-xs uppercase tracking-[0.2em] hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-50 flex items-center gap-4"
        >
          {mutation.isPending ? 'ASSESSING...' : 'Check My Risk'}
          {!mutation.isPending && <span className="material-symbols-outlined text-sm">bolt</span>}
        </button>
      </section>

      {/* Results */}
      {riskResult && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-end justify-between mb-4 border-b border-outline-variant/10 pb-2">
              <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                Conditions by Risk Level
              </h3>
              <span className="font-mono text-[10px] text-neutral-600">sorted by highest risk</span>
            </div>

            {riskResult.conditions
              .slice()
              .sort((a, b) => b.risk_percent - a.risk_percent)
              .filter((cond) => cond.risk_percent > 0)
              .map((cond) => (
                <div key={cond.name} className="bg-surface-container-low grid grid-cols-12 p-6 gap-6">
                  <div className="col-span-3 flex flex-col items-center justify-center border-r border-outline-variant/10">
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-surface-container-high" strokeWidth="2" />
                        <circle
                          cx="18" cy="18" r="16" fill="none"
                          className={getRingColor(cond.severity)}
                          strokeDasharray={getRingDash(cond.risk_percent)}
                          strokeLinecap="square"
                          strokeWidth="2"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-sm font-bold">{cond.risk_percent}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-9">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold tracking-tight">{cond.display_name}</h4>
                      <span className="px-2 py-0.5 bg-surface-container-high text-neutral-300 text-[10px] font-mono uppercase tracking-tighter">
                        {cond.severity}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed mb-4">{cond.message}</p>

                    {cond.requires_doctor && cond.risk_percent > 0 ? (
                      <div className="bg-[#B84040] p-4">
                        <p className="text-white font-mono text-xs font-black uppercase tracking-widest">
                          PLEASE CONSULT A DOCTOR
                        </p>
                      </div>
                    ) : (
                      cond.lifestyle_tips.length > 0 && (
                        <ul className="space-y-1">
                          {cond.lifestyle_tips.map((tip, i) => (
                            <li key={i} className="flex items-center gap-2 font-mono text-[10px] text-neutral-400">
                              <span className="w-1 h-1 bg-secondary rounded-full flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      )
                    )}
                  </div>
                </div>
              ))}
          </div>

          <aside className="lg:col-span-4 space-y-8">
            {riskResult.requires_immediate_attention && (
              <div className="bg-[#B84040] p-6 flex flex-col gap-4">
                <span className="text-white font-mono text-xs font-black uppercase tracking-[0.2em]">
                  Consultation Mandate
                </span>
                <p className="text-on-primary text-sm font-bold leading-snug">
                  PLEASE CONSULT A DOCTOR. HIGH-RISK VECTORS EXCEED THRESHOLDS FOR AUTOMATED ANALYSIS.
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/prediction')}
              className="w-full bg-surface-container-low border border-outline-variant/20 text-neutral-400 py-4 font-mono text-xs uppercase tracking-widest hover:border-white/30 hover:text-white transition-all"
            >
              SEE ML PREDICTION
            </button>
          </aside>
        </section>
      )}

      <Footer />
    </div>
  )
}
