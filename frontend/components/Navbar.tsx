"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/interact", label: "Live Agent" },
  { href: "#features", label: "Features" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4"
    >
      <div
        className="max-w-7xl mx-auto mt-4 px-6 py-3 rounded-xl flex items-center justify-between"
        style={{
          background: scrolled
            ? "rgba(3, 3, 5, 0.9)"
            : "rgba(3, 3, 5, 0.5)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 212, 255, 0.12)",
          boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.5)" : "none",
          transition: "background 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-display font-bold"
              style={{
                background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(6,255,215,0.1))",
                border: "1px solid rgba(0,212,255,0.5)",
                boxShadow: "0 0 15px rgba(0,212,255,0.3)",
                color: "var(--neon-blue)",
              }}
            >
              RL
            </div>
            {/* Pulse ring */}
            <div
              className="absolute inset-0 rounded-lg animate-ping"
              style={{
                border: "1px solid rgba(0,212,255,0.3)",
                animationDuration: "2s",
              }}
            />
          </div>
          <span
            className="font-display font-bold text-sm tracking-[0.12em] uppercase hidden sm:block"
            style={{ color: "var(--text-primary)" }}
          >
            Rescue<span style={{ color: "var(--neon-blue)" }}>Lens</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = router.pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-xs font-display uppercase tracking-[0.12em] transition-colors duration-200"
                style={{ color: isActive ? "var(--neon-blue)" : "var(--text-secondary)" }}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-px"
                    style={{ background: "var(--neon-blue)", boxShadow: "0 0 6px var(--neon-blue)" }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* CTA */}
          <Link href="/interact">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-xs px-4 py-2 hidden sm:flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current rec-indicator" />
              Live Agent
            </motion.button>
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded"
            style={{ color: "var(--text-secondary)" }}
          >
            <div className="w-5 flex flex-col gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: menuOpen && i === 0 ? 45 : menuOpen && i === 2 ? -45 : 0,
                    y:      menuOpen && i === 0 ? 6 : menuOpen && i === 2 ? -6 : 0,
                    opacity: menuOpen && i === 1 ? 0 : 1,
                  }}
                  className="h-px w-full"
                  style={{ background: "var(--neon-blue)" }}
                />
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="md:hidden max-w-7xl mx-auto mt-2 rounded-xl overflow-hidden"
            style={{
              background: "rgba(3,3,5,0.95)",
              border: "1px solid rgba(0,212,255,0.12)",
              backdropFilter: "blur(20px)",
            }}
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-4 text-xs font-display uppercase tracking-[0.12em] border-b"
                  style={{
                    color: "var(--text-secondary)",
                    borderColor: "rgba(0,212,255,0.06)",
                  }}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
