import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChooserPage from "./components/ChooserPage";
import Chatbot from "./components/Chatbot";
import ClaimChecker from "./components/ClaimChecker";
import LoginEntry from "./components/auth/LoginEntry";
import RegisterForm from "./components/auth/RegisterForm";
import ClaimStoryChatbot from "./components/ClaimStoryChatbot";
import AboutQKAI from "./components/ui/AboutQKAI";
import ContactQKAI from "./components/ui/contact";
import HelpQKAI from "./components/ui/Help";
import FAQQKAI from "./components/ui/FAQ";
import ClaimResult from "./components/ClaimResult";
import AdminDashboard from "./components/admin/AdminDashboard";
import PlanPage from "./components/PlanPage";
import PlanDashboard from "./components/PlanDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginEntry />} />
        <Route path="/register" element={<RegisterForm />} />

        <Route path="/choose" element={<ChooserPage />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/claim-checker" element={<ClaimChecker />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/plan-dashboard" element={<PlanDashboard />} />
        <Route path="/claim-story/:claimId" element={<ClaimStoryChatbot />} />
        <Route path="/claim-result/:claimId" element={<ClaimResult />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="/about" element={<AboutQKAI />} />
        <Route path="/help" element={<HelpQKAI />} />
        <Route path="/faq" element={<FAQQKAI />} />
        <Route path="/contact" element={<ContactQKAI />} />

        <Route path="*" element={<ChooserPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
