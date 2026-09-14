"use client";

import { FiMoon, FiSun } from "react-icons/fi";
import { THEME_LABEL_TO_DARK, THEME_LABEL_TO_LIGHT } from "./theme.constants";
import { useTheme } from "./useTheme";

export function ThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? THEME_LABEL_TO_LIGHT : THEME_LABEL_TO_DARK}
      title={isDark ? THEME_LABEL_TO_LIGHT : THEME_LABEL_TO_DARK}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-all duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {isDark ? (
        <FiSun aria-hidden="true" className="h-5 w-5" />
      ) : (
        <FiMoon aria-hidden="true" className="h-5 w-5" />
      )}
    </button>
  );
}
