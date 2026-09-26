"use client";
import { useOnboarding } from "../context/OnboardingContext";
import { usePathname } from "next/navigation";
import { UserProvider } from "../context/UserContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ToastContainer from "./ToastContainer";
import { useTrackPageView } from "../lib/useAnalytics";
import { useEffect } from "react";
import { themeManager } from "./themeManager";

export default function LayoutContentClient({ children }: { children: React.ReactNode }) {
  const { showWelcomeGlobal } = useOnboarding();
  const pathname = usePathname();
  
  // Track page views globally
  useTrackPageView();

  // Initialize theme on mount
  useEffect(() => {
    themeManager.applyTheme(themeManager.getTheme());
  }, []);
  
  // Si estamos en /login y showWelcomeGlobal, solo renderiza children (el modal)
  if (pathname === "/login" && showWelcomeGlobal) {
    return <>{children}</>;
  }
  return (
    <UserProvider>
      <ToastContainer />
      <Navbar />
      {children}
      <Footer />
    </UserProvider>
  );
}
