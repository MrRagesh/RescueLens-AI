"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored !== "light";
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.add("light-mode");
    }
  };

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex items-center gap-2 px-3 py-2 rounded-full glass neon-border text-xs font-mono"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Track */}
      <div
        className="relative w-10 h-5 rounded-full transition-colors duration-300"
        style={{
          background: isDark
            ? "rgba(0, 212, 255, 0.15)"
            : "rgba(255, 200, 0, 0.2)",
          border: isDark
            ? "1px solid rgba(0, 212, 255, 0.4)"
            : "1px solid rgba(255, 200, 0, 0.4)",
        }}
      >
        {/* Thumb */}
        <motion.div
          animate={{ x: isDark ? 2 : 22 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
          style={{
            background: isDark
              ? "var(--neon-blue)"
              : "#f59e0b",
            boxShadow: isDark
              ? "0 0 8px var(--neon-blue)"
              : "0 0 8px #f59e0b",
          }}
        >
          {isDark ? "◉" : "☀"}
        </motion.div>
      </div>

      <span
        style={{ 
          color: isDark ? "var(--neon-blue)" : "#f59e0b",
          fontSize: "0.6rem", 
          letterSpacing: "0.15em" 
        }}
        className="hidden sm:block uppercase tracking-widest"
      >
        {isDark ? "Dark" : "Light"}
      </span>
    </motion.button>
  );
}
