import Navbar from "./Navbar.jsx";

export default function ContactQKAI() {
  return (
    <>
      <Navbar />

      {/* ⬇️ FIX */}
      <div className="min-h-screen bg-black text-white px-4 pt-24 sm:pt-28 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_1fr] items-start">

          {/* Left */}
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-400">
              Contact
            </p>

            <h1 className="text-2xl sm:text-3xl font-black leading-tight">
              Get in touch with the
              <span className="block bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
                QK.AI team
              </span>
            </h1>

            <div className="rounded-2xl border border-neutral-800 bg-[#0b1120]/90 p-6 flex gap-4">
              <img
                src="/bhuvan.jpg"
                alt="Bhuvan KK"
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h2 className="font-bold text-lg">Bhuvan KK</h2>
                <p className="text-sm text-neutral-400">
                  Full-Stack Developer • QK.AI
                </p>
                <p className="text-sm mt-2">
                  📞 <span className="text-sky-300">+91 9036694320</span>
                </p>
                <p className="text-sm">
                  ✉️{" "}
                  <a
                    href="mailto:bhuvankk2005@gmail.com"
                    className="text-sky-300 underline"
                  >
                    bhuvankk2005@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="rounded-2xl border border-neutral-800 bg-[#111827]/90 p-6">
            <h3 className="font-bold text-lg mb-2">Quick Message</h3>
            <p className="text-sm text-neutral-300">
              Reach out anytime — replies within 24 hours.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
