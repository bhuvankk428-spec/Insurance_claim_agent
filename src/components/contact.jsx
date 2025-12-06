// src/components/ContactQKAI.jsx
export default function ContactQKAI() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full grid gap-10 md:grid-cols-[1.1fr_1fr] items-center">
        {/* Left: Heading + info */}
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-sky-400 mb-3">
            Contact
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Get in touch with the
            <span className="block bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              QK.AI team
            </span>
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base mb-6 leading-relaxed">
            Have questions, ideas, or feedback about QK.AI? Reach out directly to
            the developer behind the project.
          </p>

          {/* Developer card */}
          <div className="rounded-3xl border border-neutral-800 bg-[#0b1120]/80 p-5 flex items-center gap-4">
            <img
              src="/bhuvan.jpg"        
              alt="Bhuvan KK"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-sky-500"
            />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Bhuvan KK</h2>
              <p className="text-xs sm:text-sm text-neutral-400 mb-2">
                Developer • QK.AI
              </p>
              <p className="text-xs sm:text-sm text-neutral-300">
                Phone: <span className="text-sky-300">+91 9036694320</span>
              </p>
              <p className="text-xs sm:text-sm text-neutral-300">
                Email:{" "}
                <a
                  href="mailto:bhuvankk2005@gmail.com"
                  className="text-sky-300 hover:text-sky-200 underline underline-offset-2"
                >
                  bhuvankk2005@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right: simple contact box */}
        <div className="rounded-3xl border border-neutral-800 bg-[#111827]/80 p-6 sm:p-8 shadow-2xl">
          <h3 className="text-lg sm:text-xl font-semibold mb-3">
            Quick message
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 mb-4">
            Prefer email? Send a message any time and get a response as soon as
            possible.
          </p>
          <ul className="text-xs sm:text-sm text-neutral-400 space-y-2 list-disc list-inside">
            <li>Mention what you are building or testing with QK.AI.</li>
            <li>Share bugs, feature ideas, or UI suggestions.</li>
            <li>Optionally include screenshots or policy examples.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
