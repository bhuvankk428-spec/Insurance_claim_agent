import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChooserPage from "./components/ChooserPage";
import Chatbot from "./components/Chatbot";
import ClaimChecker from "./components/ClaimChecker";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import ClaimStoryChatbot from "./components/ClaimStoryChatbot";
import AboutQKAI from "./components/ui/AboutQKAI";
import ContactQKAI from "./components/ui/contact";
            import HelpQKAI from "./components/ui/Help";
import FAQQKAI from "./components/ui/FAQ";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        <Route path="/choose" element={<ChooserPage />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/claim-checker" element={<ClaimChecker />} />
       <Route path="/claim-story/:claimId" element={<ClaimStoryChatbot />} />
        {/* fallback for any unmatched url */}
        <Route path="*" element={<ChooserPage />} />
        <Route path="/about" element={<AboutQKAI />} />
        <Route path="/help" element={<HelpQKAI />} />
        <Route path="/faq" element={<FAQQKAI />} />
        <Route path="/contact" element={<ContactQKAI />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


