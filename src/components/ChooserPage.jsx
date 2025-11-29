import { useNavigate } from "react-router-dom";
import { FaSearch, FaClipboardCheck } from "react-icons/fa";

export default function ChooserPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-black via-[#141e30] to-gray-900">
      <h1 className="text-4xl font-extrabold mb-14 text-white tracking-tight text-center drop-shadow-lg">
        Welcome! What would you like to do?
      </h1>
      <div className="flex gap-14">
        {/* Summarizer Card */}
        <HoverCard
          icon={<FaSearch className="text-5xl text-sky-200 mb-4" />}
          title="Policy Summarizer"
          desc="Get personalized insurance answers and friendly analysis of all available policies."
          tag="Best for Deciding"
          tagColor="bg-sky-700 text-sky-100"
          onClick={() => navigate("/chatbot")}
        />
        {/* Claim Checker Card */}
        <HoverCard
          icon={<FaClipboardCheck className="text-5xl text-violet-200 mb-4" />}
          title="Policy Claim Checker"
          desc="Check if your scenario is claimable and see next steps for a smooth process."
          tag="Best for Claims"
          tagColor="bg-violet-800 text-blue-100"
          onClick={() => navigate("/claim-checker")}
        />
      </div>
    </div>
  );
}

// Reusable animated card
function HoverCard({ icon, title, desc, tag, tagColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer relative bg-[#181e27]/90 backdrop-blur-xl border border-[#222231] hover:scale-105 hover:shadow-2xl transition transform rounded-3xl p-10 w-[340px] min-h-[340px] flex flex-col items-center group`}
    >
      {/* Shine effect on hover */}
      <span className="absolute hidden group-hover:block group-hover:animate-pulse right-5 top-3 text-2xl text-sky-400 drop-shadow-xl">★</span>
      {icon}
      <h2 className="text-2xl font-bold text-white mb-3 text-center">{title}</h2>
      <p className="text-gray-200 text-md text-center mb-8">{desc}</p>
      <span className={"px-4 py-1 rounded-full font-semibold text-sm " + tagColor}>
        {tag}
      </span>
    </div>
  );
}
