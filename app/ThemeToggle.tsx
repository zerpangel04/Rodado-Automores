"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  function pick(next: Theme) {
    setThemeState(next);
    applyTheme(next);
  }

  return (
    <div className={`theme-toggle${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className={theme === "dark" ? "active" : ""}
        onClick={() => pick("dark")}
        aria-label="Tema oscuro"
        aria-pressed={theme === "dark"}
      >
        🌙
      </button>
      <button
        type="button"
        className={theme === "light" ? "active" : ""}
        onClick={() => pick("light")}
        aria-label="Tema claro"
        aria-pressed={theme === "light"}
      >
        ☀️
      </button>
    </div>
  );
}
