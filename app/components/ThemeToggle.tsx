"use client";
import React, { useEffect, useState } from "react";
import { themeManager } from "./themeManager";

const ThemeToggle = () => {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(themeManager.getTheme());
    const handler = (e) => setTheme(e.detail.theme);
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  const handleToggleTheme = () => {
    themeManager.toggleTheme();
    setTheme(themeManager.getTheme());
  };

  return (
    <button
      className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors hover:bg-white/10"
      style={{ color: theme === "light" ? "#0f172a" : "#ffffff" }}
      onClick={handleToggleTheme}
      title="Cambiar tema"
      aria-label="Cambiar tema"
    >
      <span className="material-icons-round text-2xl">
        {theme === "dark" ? "dark_mode" : "light_mode"}
      </span>
    </button>
  );
};

export default ThemeToggle;
