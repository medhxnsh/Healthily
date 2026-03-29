interface Props {
  visible: boolean
  message?: string
}

export default function LoadingOverlay({ visible, message = 'Analyzing your report...' }: Props) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-[#0C0C0F]/90 backdrop-blur-[15px] z-[100] flex items-center justify-center flex-col gap-8">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 border border-[#B84040]/30 animate-ping" />
        <div className="absolute inset-4 border border-[#B84040]/50 animate-pulse" />
        <div className="absolute inset-8 bg-[#B84040]" />
      </div>
      <div className="text-center">
        <h3 className="font-mono text-sm tracking-[0.5em] text-white">{message}</h3>
        <p className="font-mono text-[10px] text-neutral-500 mt-2 uppercase">
          This may take a few seconds
        </p>
      </div>
    </div>
  )
}
