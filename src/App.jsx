import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChooserPage from "./components/ChooserPage";
import Chatbot from "./components/Chatbot";
import ClaimChecker from "./components/ClaimChecker";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import ClaimStoryChatbot from "./components/ClaimStoryChatbot";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/choose" element={<ChooserPage />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/claim-checker" element={<ClaimChecker />} />
        {/* Optional: fallback for any unmatched url */}
        {/* <Route path="*" element={<ChooserPage />} /> */}
        <Route path="/claim-story" element={<ClaimStoryChatbot />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
