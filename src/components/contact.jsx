
export default function ContactQKAI() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto w-full grid gap-8 sm:gap-10 lg:grid-cols-[1.1fr_1fr] items-start lg:items-center">
        {/* Left: Heading + info */}
        <div className="order-2 lg:order-1 space-y-6 sm:space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-400 mb-3">
              Contact
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 leading-tight">
              Get in touch with the
              <span className="block bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
                QK.AI team
              </span>
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
              Have questions, ideas, or feedback about QK.AI? Reach out directly to
              the developer behind the project.
            </p>
          </div>

          {/* Developer card - Full width mobile */}
          <div className="rounded-2xl lg:rounded-3xl border border-neutral-800 bg-[#0b1120]/90 p-5 sm:p-6 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 shadow-2xl">
            <div className="flex-shrink-0">
              <img
                src="/bhuvan.jpg"
                alt="Bhuvan KK"
                className="w-20 h-20 sm:w-24 sm:h-24 lg:w-20 lg:h-20 rounded-full object-cover border-3 border-sky-500/50 shadow-2xl"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl lg:text-xl font-bold text-white mb-1 sm:mb-2">
                Bhuvan KK
              </h2>
              <p className="text-sm sm:text-base lg:text-sm text-neutral-400 mb-3 sm:mb-4">
                Full-Stack Developer • QK.AI
              </p>
              <div className="space-y-2 text-sm sm:text-base lg:text-sm">
                <p className="text-neutral-300 font-mono">
                  📞 <span className="text-sky-300 font-semibold ml-1">+91 9036694320</span>
                </p>
                <p className="text-neutral-300">
                  ✉️{" "}
                  <a
                    href="mailto:bhuvankk2005@gmail.com"
                    className="text-sky-300 hover:text-sky-200 font-semibold underline underline-offset-2 decoration-sky-400 hover:decoration-sky-300 transition-all"
                  >
                    bhuvankk2005@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact box - Stacks above on mobile */}
        <div className="order-1 lg:order-2 rounded-2xl lg:rounded-3xl border border-neutral-800 bg-[#111827]/90 p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl lg:text-xl font-bold text-white mb-2 tracking-tight">
              Quick Message
            </h3>
            <p className="text-sm sm:text-base lg:text-sm text-neutral-300 leading-relaxed">
              Prefer email? Send a message anytime and get a response within 24 hours.
            </p>
            
            <ul className="text-xs sm:text-sm lg:text-xs text-neutral-400 space-y-3 list-disc list-inside pl-3 sm:pl-4">
              <li>Describe what you're building or testing with QK.AI</li>
              <li>Share bugs, feature requests, or UI suggestions</li>
              <li>Include screenshots or policy examples if relevant</li>
            </ul>

            <div className="pt-6 border-t border-neutral-700/50">
              <p className="text-xs sm:text-sm text-sky-400 font-medium">
                🚀 Working on insurance AI full-time
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Responses typically within hours during weekdays.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
