export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0b0f14] via-[#0d1320] to-[#0f172a] overflow-hidden">
      <div className="absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(56,189,248,0.25)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(16,185,129,0.18)_1px,transparent_0)] [background-size:28px_28px] [background-position:12px_10px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-emerald-900/20" />
      </div>

      <div className="relative flex flex-col items-center">
        <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 blur-2xl animate-[pulse_2s_ease-in-out_infinite] motion-reduce:animate-none" />
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-cyan-500/60 bg-gradient-to-br from-cyan-900/50 to-emerald-900/50 flex items-center justify-center shadow-2xl animate-[zoomInOut_2s_ease-in-out_infinite] motion-reduce:animate-none">
          <img
            src="/logo.png"
            alt="QK.AI Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-lg"
          />
        </div>
        <div className="mt-5 text-sm tracking-[0.35em] text-sky-200/70 uppercase">
          Loading
        </div>
      </div>

      <style>{`
        @keyframes zoomInOut {
          0% { transform: scale(0.92); }
          50% { transform: scale(1.05); }
          100% { transform: scale(0.92); }
        }
      `}</style>
    </div>
  );
}
