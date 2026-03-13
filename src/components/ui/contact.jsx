import Navbar from "./Navbar.jsx";

export default function ContactQKAI() {
  const teamMembers = [
    {
      name: "Chaithanya",
      role: "Team Member - INSURE.AI",
      email: "ChaithanyaN31@gmail.com",
    },
    {
      name: "Ashritha",
      role: "Team Member - INSURE.AI",
      email: "ashritha@gmail.com",
    },
    {
      name: "Deepashree",
      role: "Team Member - INSURE.AI",
      email: "deepashree@gmail.com",
    },
  ];

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#0b0f14] text-white px-4 pt-24 sm:pt-28 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_1fr] items-start">

          {/* Left */}
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
              Contact
            </p>

            <h1 className="text-2xl sm:text-3xl font-black leading-tight">
              Get in touch with the
              <span className="block bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                INSURE.AI team
              </span>
            </h1>

            <div className="grid gap-4">
              {teamMembers.map((member) => (
                <div
                  key={member.email}
                  className="rounded-2xl border border-neutral-800 bg-[#0b1120]/90 p-6 flex gap-4"
                >
                  <img
                    src="/logo.png"
                    alt={`${member.name} profile`}
                    className="w-20 h-20 rounded-full object-contain bg-white p-3"
                  />
                  <div>
                    <h2 className="font-bold text-lg">{member.name}</h2>
                    <p className="text-sm text-neutral-400">{member.role}</p>
                    <p className="text-sm mt-2">
                      Email:{" "}
                      <a
                        href={`mailto:${member.email}`}
                        className="text-cyan-300 underline"
                      >
                        {member.email}
                      </a>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="rounded-2xl border border-neutral-800 bg-[#111827]/90 p-6">
            <h3 className="font-bold text-lg mb-2">Quick Message</h3>
            <p className="text-sm text-neutral-300">
              Reach out to the INSURE.AI team anytime for product questions,
              partnerships, or support.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
