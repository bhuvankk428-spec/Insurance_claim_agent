import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { isAdminEmail } from "../components/admin/adminAuth";

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center">
      <p className="text-sm text-neutral-300">Checking session...</p>
    </div>
  );
}

export function RedirectIfAuthed({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <AuthLoadingScreen />;
  if (!user) return children;
  if (isAdminEmail(user.email)) {
    return <Navigate to="/admin-dashboard" replace />;
  }
  return <Navigate to="/choose" replace />;
}

export function RequireUserAuth({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();
  if (authLoading) return <AuthLoadingScreen />;
  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export function RequireAdminAuth({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();
  if (authLoading) return <AuthLoadingScreen />;
  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  if (!isAdminEmail(user.email)) {
    return <Navigate to="/choose" replace />;
  }
  return children;
}
