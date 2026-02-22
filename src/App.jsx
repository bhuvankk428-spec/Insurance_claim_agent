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
import FinanceNews from "./components/FinanceNews";
import Dashboard from "./components/Dashboard";
import {
  RedirectIfAuthed,
  RequireAdminAuth,
  RequireUserAuth,
} from "./auth/RouteGuards";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RedirectIfAuthed>
              <LoginEntry />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <RegisterForm />
            </RedirectIfAuthed>
          }
        />

        <Route
          path="/choose"
          element={
            <RequireUserAuth>
              <ChooserPage />
            </RequireUserAuth>
          }
        />
        <Route
          path="/chatbot"
          element={
            <RequireUserAuth>
              <Chatbot />
            </RequireUserAuth>
          }
        />
        <Route
          path="/claim-checker"
          element={
            <RequireUserAuth>
              <ClaimChecker />
            </RequireUserAuth>
          }
        />
        <Route
          path="/plan"
          element={
            <RequireUserAuth>
              <PlanPage />
            </RequireUserAuth>
          }
        />
        <Route
          path="/plan-dashboard"
          element={
            <RequireUserAuth>
              <PlanDashboard />
            </RequireUserAuth>
          }
        />
        <Route
          path="/finance-news"
          element={
            <RequireUserAuth>
              <FinanceNews />
            </RequireUserAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireUserAuth>
              <Dashboard />
            </RequireUserAuth>
          }
        />
        <Route
          path="/claim-story/:claimId"
          element={
            <RequireUserAuth>
              <ClaimStoryChatbot />
            </RequireUserAuth>
          }
        />
        <Route
          path="/claim-result/:claimId"
          element={
            <RequireUserAuth>
              <ClaimResult />
            </RequireUserAuth>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <RequireAdminAuth>
              <AdminDashboard />
            </RequireAdminAuth>
          }
        />

        <Route
          path="/about"
          element={
            <RequireUserAuth>
              <AboutQKAI />
            </RequireUserAuth>
          }
        />
        <Route
          path="/help"
          element={
            <RequireUserAuth>
              <HelpQKAI />
            </RequireUserAuth>
          }
        />
        <Route
          path="/faq"
          element={
            <RequireUserAuth>
              <FAQQKAI />
            </RequireUserAuth>
          }
        />
        <Route
          path="/contact"
          element={
            <RequireUserAuth>
              <ContactQKAI />
            </RequireUserAuth>
          }
        />

        <Route path="*" element={<NavigateByAuth />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

function NavigateByAuth() {
  return (
    <RedirectIfAuthed>
      <LoginEntry />
    </RedirectIfAuthed>
  );
}
