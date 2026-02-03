import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import SplashScreen from "./SplashScreen";

export default function LoginEntry() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <LoginForm />;
}
