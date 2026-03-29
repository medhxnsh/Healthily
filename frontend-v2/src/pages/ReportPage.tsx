import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Footer from '../components/Footer'
import type { BloodParameterOut } from '../api/types'

const STATUS_STYLES: Record<string, string> = {
  high: 'bg-primary-container text-on-primary-container',
  low: 'bg-secondary-container text-on-secondary-container',
  normal: 'bg-neutral-700 text-neutral-300',
  unknown: 'bg-surface-container-high text-neutral-400',
}

const PARAM_EXPLANATIONS: Record<string, { what: string; low: string; high: string; normal: string }> = {
  hemoglobin: {
    what: 'Hemoglobin is the protein in red blood cells that carries oxygen from your lungs to every part of your body.',
    low: 'Your hemoglobin is below the normal range. This often indicates anemia, which can be caused by iron deficiency, blood loss, or problems with red blood cell production. Common symptoms include fatigue, weakness, and shortness of breath.',
    high: 'Your hemoglobin is above the normal range. This can occur with dehydration or a condition where the body produces too many red blood cells. It may increase the risk of blood clotting.',
    normal: 'Your hemoglobin is within the normal range, indicating your red blood cells are carrying oxygen effectively.',
  },
  mcv: {
    what: 'MCV (Mean Corpuscular Volume) measures the average size of your red blood cells.',
    low: 'Your red blood cells are smaller than normal. This is commonly seen in iron deficiency anemia or thalassemia, conditions that affect how your body makes red blood cells.',
    high: 'Your red blood cells are larger than normal. This can be caused by vitamin B12 or folate deficiency, and sometimes by liver disease or thyroid problems.',
    normal: 'Your red blood cell size is normal, which is a good indicator of healthy red blood cell production.',
  },
  mch: {
    what: 'MCH (Mean Corpuscular Hemoglobin) measures the average amount of hemoglobin contained in each red blood cell.',
    low: 'Each red blood cell contains less hemoglobin than normal. This is typically associated with iron deficiency and means your red blood cells may not be carrying as much oxygen as they should.',
    high: 'Each red blood cell contains more hemoglobin than normal. This is often seen alongside large red blood cells and may indicate a vitamin B12 or folate deficiency.',
    normal: 'The amount of hemoglobin in your red blood cells is normal.',
  },
  mchc: {
    what: 'MCHC (Mean Corpuscular Hemoglobin Concentration) measures the concentration of hemoglobin in your red blood cells.',
    low: 'The concentration of hemoglobin in your red blood cells is below normal. This is most commonly a sign of iron deficiency anemia.',
    high: 'The concentration of hemoglobin is higher than normal. This is rare and can sometimes be seen in hereditary spherocytosis.',
    normal: 'The hemoglobin concentration in your red blood cells is normal.',
  },
  wbc: {
    what: 'WBC (White Blood Cell count) measures the number of immune cells in your blood. These cells defend your body against infections and illness.',
    low: 'You have fewer white blood cells than normal. This can weaken your immune system, making it harder for your body to fight infections. It may be caused by viral infections, bone marrow issues, or certain medications.',
    high: 'You have more white blood cells than normal. This is usually a response to an active infection or inflammation. In some cases it can indicate a blood disorder.',
    normal: 'Your white blood cell count is normal, suggesting your immune system is functioning well.',
  },
  platelets: {
    what: 'Platelets are tiny blood cells that help your blood clot when you have a cut or injury.',
    low: 'Your platelet count is below normal. This can increase the risk of bruising easily or taking longer to stop bleeding. It may be caused by viral infections, certain medications, or bone marrow conditions.',
    high: 'Your platelet count is above normal. This can increase the risk of blood clots. It is sometimes seen after infections or inflammation.',
    normal: 'Your platelet count is normal, meaning your blood should clot properly.',
  },
  glucose: {
    what: 'Glucose is the main sugar in your blood and your body\'s primary source of energy.',
    low: 'Your blood sugar is below normal. This is called hypoglycemia and can cause symptoms like dizziness, shakiness, sweating, or confusion.',
    high: 'Your blood sugar is above normal. Persistently high blood sugar can indicate diabetes or pre-diabetes and increases the risk of organ damage over time.',
    normal: 'Your blood sugar is within the normal range.',
  },
  creatinine: {
    what: 'Creatinine is a waste product produced by your muscles. Your kidneys filter it out of your blood.',
    low: 'Low creatinine can indicate reduced muscle mass. It is less commonly a concern on its own.',
    high: 'High creatinine suggests your kidneys may not be filtering waste effectively. This is an important finding that warrants follow-up.',
    normal: 'Your creatinine level is normal, suggesting your kidneys are filtering waste effectively.',
  },
  tsh: {
    what: 'TSH (Thyroid Stimulating Hormone) is produced by your brain to control the thyroid gland, which regulates your metabolism and energy.',
    low: 'Your TSH is below normal, which may indicate your thyroid is overactive (hyperthyroidism). This can cause symptoms like rapid heartbeat, weight loss, and anxiety.',
    high: 'Your TSH is above normal, which may indicate your thyroid is underactive (hypothyroidism). This can cause fatigue, weight gain, and feeling cold.',
    normal: 'Your TSH level is normal, suggesting your thyroid is functioning well.',
  },
  cholesterol: {
    what: 'Total cholesterol measures all the cholesterol in your blood, including both good (HDL) and bad (LDL) types.',
    low: 'Your total cholesterol is lower than typical. While usually not a concern, very low cholesterol in rare cases may be associated with certain health conditions.',
    high: 'Your total cholesterol is elevated. High cholesterol increases the risk of heart disease and stroke over time. Diet, exercise, and sometimes medication can help bring it down.',
    normal: 'Your total cholesterol is within the acceptable range.',
  },
}

function getContent(param: BloodParameterOut): { what: string; statusText: string } {
  const key = param.name.toLowerCase().replace(/[^a-z]/g, '')
  const entry = PARAM_EXPLANATIONS[key]

  const what = entry?.what ?? `${param.name} is a blood parameter measured in ${param.unit || 'standard units'}.`

  let statusText: string
  if (param.status === 'low') {
    statusText = entry?.low ?? `Your ${param.name} is below the normal range (${param.ref_low ?? '?'} - ${param.ref_high ?? '?'} ${param.unit}). Please consult your doctor for a detailed evaluation.`
  } else if (param.status === 'high') {
    statusText = entry?.high ?? `Your ${param.name} is above the normal range (${param.ref_low ?? '?'} - ${param.ref_high ?? '?'} ${param.unit}). Please consult your doctor for a detailed evaluation.`
  } else {
    statusText = entry?.normal ?? `Your ${param.name} is within the normal range.`
  }

  return { what, statusText }
}

export default function ReportPage() {
  const navigate = useNavigate()
  const { parameters, reportSummary, disclaimer, anomalyCount } = useStore()
  const [selectedParam, setSelectedParam] = useState<BloodParameterOut | null>(null)

  if (parameters.length === 0) {
    return (
      <div className="p-16">
        <p className="font-mono text-neutral-500">No report data. Upload a file first.</p>
        <button
          onClick={() => navigate('/upload')}
          className="mt-4 px-6 py-3 bg-[#B84040] text-white font-mono text-xs tracking-widest"
        >
          GO TO UPLOAD
        </button>
      </div>
    )
  }

  const criticalParams = parameters.filter((p) => p.is_critical)
  const selected = selectedParam
  const content = selected ? getContent(selected) : null

  return (
    <div className="min-h-screen px-12 py-16 relative">
      {/* Background */}
      <div
        className="fixed right-[-10%] top-0 h-full w-[40vw] opacity-[0.06] pointer-events-none"
        style={{ background: 'repeating-linear-gradient(45deg, #3A5A7C 0px, #3A5A7C 1px, transparent 1px, transparent 20px)' }}
      />

      {/* Top section: summary left, stats right */}
      <div className="flex gap-12 mb-10">

        {/* Left: summary or selected param description */}
        <div className="flex-[3]">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#B84040] mb-6 block">
            {selected ? selected.name : 'Plain Language Summary'}
          </span>

          {selected && content ? (
            <div>
              {/* What is this parameter */}
              <p className="text-2xl font-light leading-relaxed text-on-surface mb-6">
                {content.what}
              </p>
              {/* Status explanation */}
              <p className={`text-2xl font-light leading-relaxed mb-6 ${
                selected.status === 'high' ? 'text-[#B84040]' :
                selected.status === 'low' ? 'text-secondary' :
                'text-tertiary'
              }`}>
                {content.statusText}
              </p>
              {/* Range + value */}
              <div className="flex gap-8 mt-4">
                <div>
                  <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Your Value</p>
                  <p className="font-mono text-xl font-bold">{selected.value} <span className="text-neutral-500 text-sm">{selected.unit}</span></p>
                </div>
                {selected.ref_low !== null && selected.ref_high !== null && (
                  <div>
                    <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Normal Range</p>
                    <p className="font-mono text-xl font-bold text-neutral-400">{selected.ref_low} - {selected.ref_high} <span className="text-sm">{selected.unit}</span></p>
                  </div>
                )}
                {selected.is_critical && (
                  <div className="self-end">
                    <span className="px-3 py-1 bg-[#B84040]/20 text-[#B84040] font-mono text-[10px] uppercase tracking-widest">
                      Critical Value
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedParam(null)}
                className="mt-8 font-mono text-[10px] text-neutral-500 uppercase tracking-widest hover:text-neutral-300 transition-colors"
              >
                Back to full summary
              </button>
            </div>
          ) : reportSummary ? (
            <div className="space-y-6">
              {reportSummary
                .split(/(?<=\.)\s+(?=[A-Z])/)
                .reduce<string[][]>((acc, sentence, i) => {
                  const groupIndex = Math.floor(i / 3)
                  if (!acc[groupIndex]) acc[groupIndex] = []
                  acc[groupIndex].push(sentence)
                  return acc
                }, [])
                .map((group, i) => (
                  <p key={i} className="text-xl font-light leading-relaxed text-on-surface">
                    {group.join(' ')}
                  </p>
                ))}
            </div>
          ) : (
            <p className="text-xl font-light leading-relaxed text-neutral-500 italic">
              Simplification unavailable.
            </p>
          )}
        </div>

        {/* Right: stats */}
        <aside className="flex-[2] flex-shrink-0">
          <div className="bg-surface-container-low p-6 space-y-8 sticky top-12">
            <div>
              <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Total Parameters</p>
              <p className="font-mono text-3xl font-bold">{parameters.length}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Anomalies</p>
              <p className={`font-mono text-3xl font-bold ${anomalyCount > 0 ? 'text-[#B84040]' : 'text-tertiary'}`}>
                {anomalyCount}
              </p>
            </div>
            {criticalParams.length > 0 && (
              <div>
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-3">
                  Critical Parameters
                </p>
                <ul className="space-y-2">
                  {criticalParams.map((p) => (
                    <li
                      key={p.name}
                      onClick={() => setSelectedParam(p)}
                      className="flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <span className="font-mono text-xs text-[#B84040] truncate max-w-[120px]">{p.name}</span>
                      <span className="font-mono text-xs text-neutral-300 mono-num ml-2">{p.value} {p.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="mb-10 py-4 px-6 bg-surface-container-low border-l border-white/10">
          <p className="font-body italic text-xs text-neutral-500 tracking-tight">{disclaimer}</p>
        </div>
      )}

      {/* Parameter table */}
      <div className="space-y-px">
        <div className="grid grid-cols-12 px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-neutral-500 border-b border-white/5">
          <div className="col-span-4">Parameter</div>
          <div className="col-span-3">Value</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-3 text-right">Range</div>
        </div>

        {parameters.map((param, i) => {
          const isSelected = selectedParam?.name === param.name
          return (
            <div
              key={param.name}
              onClick={() => setSelectedParam(isSelected ? null : param)}
              className={`grid grid-cols-12 px-6 py-5 transition-colors items-center cursor-pointer
                ${isSelected ? 'bg-surface-container-high' : i % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container-low/40'}
                hover:bg-surface-container-high
                ${param.is_critical ? 'border-l-2 border-[#B84040]' : param.status === 'low' ? 'border-l-2 border-secondary-container' : ''}
              `}
            >
              <div className={`col-span-4 font-medium tracking-tight flex items-center gap-2 ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                <span className={`text-[10px] font-mono transition-transform inline-block ${isSelected ? 'text-[#B84040] rotate-90' : ''}`}>
                  ›
                </span>
                {param.name}
              </div>
              <div className="col-span-3 mono-num text-on-surface">
                {param.value}{' '}
                <span className="text-xs text-neutral-500">{param.unit}</span>
              </div>
              <div className="col-span-2 flex justify-center">
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-tighter mono-num ${STATUS_STYLES[param.status] ?? STATUS_STYLES.unknown}`}>
                  {param.status.toUpperCase()}
                </span>
              </div>
              <div className="col-span-3 text-right mono-num text-xs text-neutral-500">
                {param.ref_low !== null && param.ref_high !== null
                  ? `${param.ref_low} - ${param.ref_high}`
                  : param.ref_high !== null
                  ? `< ${param.ref_high}`
                  : '--'}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-12">
        <button
          onClick={() => navigate('/anomalies')}
          className="px-8 py-3 bg-[#B84040] text-white font-mono text-xs tracking-widest hover:bg-on-primary-fixed-variant transition-colors"
        >
          RUN ANOMALY DETECTION
        </button>
      </div>

      <Footer />
    </div>
  )
}
