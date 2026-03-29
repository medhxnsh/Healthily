export default function Footer() {
  return (
    <footer className="border-t border-neutral-800/20 pt-8 mt-16 pb-12 px-0">
      <div className="flex justify-between items-center">
        <p className="font-mono italic text-[10px] uppercase tracking-tight text-neutral-600">
          Healthify — for informational use only
        </p>
        <div className="flex gap-8">
          <a href="#" className="font-mono italic text-[10px] uppercase tracking-tight text-neutral-600 hover:text-neutral-400">
            PRIVACY
          </a>
          <a href="#" className="font-mono italic text-[10px] uppercase tracking-tight text-neutral-600 hover:text-neutral-400">
            COMPLIANCE
          </a>
          <a href="#" className="font-mono italic text-[10px] uppercase tracking-tight text-neutral-600 hover:text-neutral-400">
            METHODOLOGY
          </a>
        </div>
      </div>
    </footer>
  )
}
