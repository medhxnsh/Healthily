import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { uploadReport } from '../api/reports'
import { useStore } from '../store/useStore'
import LoadingOverlay from '../components/LoadingOverlay'

export default function UploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [age, setAge] = useState(30)
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [dragOver, setDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { setUploadResult, setPatientInfo } = useStore()

  const mutation = useMutation({
    mutationFn: () => uploadReport(file!, age, sex),
    onSuccess: (res) => {
      if (!res.success || !res.data) {
        setErrorMsg(res.error ?? 'Upload failed')
        return
      }
      setPatientInfo(age, sex)
      setUploadResult(res.data.parameters, res.data.simplification, res.disclaimer ?? null, res.data.anomaly_count)
      navigate('/report')
    },
    onError: (err: Error) => setErrorMsg(err.message),
  })

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }, [])

  const handleSubmit = () => {
    if (!file) { setErrorMsg('Select a file first'); return }
    setErrorMsg(null)
    mutation.mutate()
  }

  return (
    <>
      <LoadingOverlay visible={mutation.isPending} />

      <div className="h-screen flex overflow-hidden">
        {/* Left: upload form */}
        <section className="flex-1 flex flex-col justify-center px-16 max-w-2xl relative z-10">
          <header className="mb-12">
            <span className="font-mono text-[14px] uppercase tracking-[0.3em] text-[#B84040] block mb-2">
              Step 1 of 6
            </span>
            <h2 className="text-4xl font-headline font-black tracking-tighter text-on-surface">
              Upload Your Blood Report
            </h2>
          </header>

          <div className="space-y-8">
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={`w-full h-48 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-[#B84040] bg-surface-container-high'
                  : 'border-outline-variant bg-surface-container-low hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-outline mb-4 text-3xl">upload_file</span>
              {file ? (
                <p className="font-mono text-sm text-white">{file.name}</p>
              ) : (
                <p className="font-body text-sm text-neutral-400">
                  DROP SOURCE FILE{' '}
                  <span className="mono-num text-neutral-600">(CSV, PDF, JPG)</span>
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]) }}
            />

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-transparent border-0 border-b border-outline-variant py-2 font-mono text-lg text-on-surface focus:ring-0 focus:border-[#B84040] transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                  Biological Sex
                </label>
                <div className="flex bg-surface-container-low p-1">
                  <button
                    onClick={() => setSex('male')}
                    className={`flex-1 py-2 font-mono text-xs transition-colors ${sex === 'male' ? 'bg-[#B84040] text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    MALE
                  </button>
                  <button
                    onClick={() => setSex('female')}
                    className={`flex-1 py-2 font-mono text-xs transition-colors ${sex === 'female' ? 'bg-[#B84040] text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    FEMALE
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="font-mono text-xs text-[#B84040]">{errorMsg}</p>
            )}

            {/* Submit */}
            <div className="flex flex-col items-end pt-8">
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="px-8 py-3 bg-[#B84040] text-white font-mono text-xs tracking-widest flex items-center gap-4 hover:bg-on-primary-fixed-variant transition-all disabled:opacity-50"
              >
                Analyze Report
                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
              </button>
              <p className="mt-8 font-mono italic text-[9px] text-neutral-600 uppercase tracking-tight">
                This tool does not provide medical advice. Always consult a doctor.
              </p>
            </div>
          </div>
        </section>

        {/* Right: 3D spatial anchor */}
        <aside className="flex-1 h-full relative overflow-hidden border-l border-neutral-800/10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,#1b1b1e_0%,#0c0c0f_70%)] opacity-50" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Animated concentric squares as 3D stand-in */}
              <div className="relative w-64 h-64 flex items-center justify-center">
                <div className="absolute w-64 h-64 border border-[#B84040]/10 animate-pulse" />
                <div className="absolute w-48 h-48 border border-[#B84040]/20" style={{ animation: 'spin 20s linear infinite' }} />
                <div className="absolute w-32 h-32 border border-[#B84040]/40" style={{ animation: 'spin 15s linear infinite reverse' }} />
                <div className="absolute w-16 h-16 bg-[#B84040]/20" style={{ animation: 'pulse 3s ease-in-out infinite' }} />
                <div className="absolute w-8 h-8 bg-[#B84040]" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
