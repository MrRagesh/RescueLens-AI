import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Navbar from "../components/Navbar";
import HeroBackground from "../components/HeroBackground";
import CustomCursor from "../components/CustomCursor";

// ── Feature data ────────────────────────────────────────
const features = [
  {
    icon: "👁",
    title: "Live Camera Vision",
    desc: "Gemini 1.5 Pro sees through your camera in real-time, analyzing objects, text, injuries, and environments with sub-second visual understanding.",
    color: "var(--neon-blue)",
    badge: "Multimodal",
  },
  {
    icon: "🎙",
    title: "Real-Time Voice Conversation",
    desc: "Speak naturally. The AI listens, understands context, and responds instantly — no push-to-talk, no lag, no friction.",
    color: "var(--neon-cyan)",
    badge: "Voice AI",
  },
  {
    icon: "🧠",
    title: "Multimodal AI Reasoning",
    desc: "Combines vision, language, and knowledge into one unified reasoning pipeline. Ask about what the camera sees — get expert-level answers.",
    color: "#818cf8",
    badge: "Gemini Pro",
  },
  {
    icon: "🗺",
    title: "Visual Explanation Generator",
    desc: "Complex instructions simplified with AI-generated step-by-step visual guides tailored to exactly what the camera captures.",
    color: "#f59e0b",
    badge: "Gen AI",
  },
  {
    icon: "💾",
    title: "Context Memory",
    desc: "Powered by Google Firestore, your conversation history persists across sessions. The AI remembers previous interactions for richer assistance.",
    color: "var(--neon-red)",
    badge: "Firestore",
  },
];

const useCases = [
  { emoji: "🩹", label: "First Aid", sub: "Wound & injury guidance" },
  { emoji: "🔧", label: "Device Repair", sub: "Tech troubleshooting" },
  { emoji: "📚", label: "Homework Help", sub: "Visual problem solving" },
  { emoji: "⚠️", label: "Safety Check", sub: "Hazard identification" },
  { emoji: "🌿", label: "Plant ID", sub: "Species recognition" },
  { emoji: "🚗", label: "Auto Assist", sub: "Car diagnostics" },
];

const steps = [
  { n: "01", title: "Point Your Camera", desc: "Aim at anything — a wound, broken device, homework problem, or unknown object." },
  { n: "02", title: "Ask or Speak", desc: "Type a question or tap the mic. RescueLens understands both voice and text naturally." },
  { n: "03", title: "AI Analyzes", desc: "Gemini 1.5 Pro processes camera feed + your query simultaneously in the cloud." },
  { n: "04", title: "Get Expert Help", desc: "Receive detailed text + voice guidance, visual steps, and follow-up support." },
];

// ── Animation variants ─────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ── Reusable section observer wrapper ─────────────────
function AnimSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────
const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>RescueLens AI — Real-Time Multimodal Emergency Assistant</title>
        <meta
          name="description"
          content="AI-powered emergency assistant that sees through your camera and responds with voice, text and visual guidance. Powered by Gemini 1.5 Pro."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <CustomCursor />
      <Navbar />

      <main style={{ background: "var(--bg-primary)" }}>

        {/* ══════════════════════════════════════════════
            HERO SECTION
           ══════════════════════════════════════════════ */}
        <section
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{ paddingTop: "80px" }}
        >
          {/* Animated particle background */}
          <HeroBackground />

          {/* Grid overlay */}
          <div className="absolute inset-0 grid-bg opacity-40" />

          {/* Radial gradient spotlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,212,255,0.07) 0%, transparent 70%)",
            }}
          />

          {/* Horizontal scan line */}
          <motion.div
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
            className="absolute left-0 right-0 h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.15) 50%, transparent 100%)",
            }}
          />

          {/* Hero content */}
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            {/* Status badge */}
            <motion.div
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass text-xs font-display uppercase tracking-[0.15em]"
              style={{
                border: "1px solid rgba(0,212,255,0.25)",
                color: "var(--neon-cyan)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full rec-indicator" style={{ background: "var(--neon-cyan)" }} />
              Powered by Gemini 1.5 Pro · Google Cloud
            </motion.div>

            {/* Main title */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              initial="hidden"
              animate="visible"
              className="font-display font-black leading-none mb-6"
              style={{
                fontSize: "clamp(3.5rem, 10vw, 8rem)",
                letterSpacing: "-0.02em",
              }}
            >
              <span
                className="glitch-text block"
                data-text="RescueLens"
                style={{ color: "var(--text-primary)" }}
              >
                Rescue
                <span className="gradient-text">Lens</span>
              </span>
              <span
                className="block text-[0.42em] font-display font-medium tracking-[0.08em] mt-2"
                style={{ color: "var(--neon-blue)", opacity: 0.9 }}
              >
                AI
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              custom={2}
              initial="hidden"
              animate="visible"
              className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
            >
              Your Real-Time AI Assistant That{" "}
              <span style={{ color: "var(--neon-blue)" }}>Sees</span>,{" "}
              <span style={{ color: "var(--neon-cyan)" }}>Hears</span>, and{" "}
              <span className="gradient-text-fire">Helps</span>
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              custom={3}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link href="/interact">
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary flex items-center gap-3 px-8 py-4 text-sm"
                  style={{ boxShadow: "var(--glow-md)" }}
                >
                  <span className="w-2 h-2 rounded-full rec-indicator" style={{ background: "currentColor" }} />
                  Start Live AI
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="btn-secondary flex items-center gap-3 px-8 py-4 text-sm"
              >
                <span>▶</span>
                Try Demo
              </motion.button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              custom={4}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap items-center justify-center gap-8 mt-16"
            >
              {[
                { val: "<1s",  label: "Response Time" },
                { val: "3",    label: "Input Modes" },
                { val: "∞",    label: "Use Cases" },
                { val: "99%",  label: "Uptime SLA" },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div
                    className="font-display font-bold text-2xl text-glow"
                    style={{ color: "var(--neon-blue)" }}
                  >
                    {val}
                  </div>
                  <div
                    className="text-xs font-display uppercase tracking-widest mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <div
              className="w-px h-12"
              style={{
                background:
                  "linear-gradient(to bottom, var(--neon-blue), transparent)",
              }}
            />
            <span
              className="text-[9px] font-display uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Scroll
            </span>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════
            FEATURES SECTION
           ══════════════════════════════════════════════ */}
        <section id="features" className="relative py-32 px-6">
          {/* Section label */}
          <AnimSection className="max-w-7xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-20">
              <span
                className="inline-block text-xs font-display uppercase tracking-[0.2em] mb-4 px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(0,212,255,0.06)",
                  border: "1px solid rgba(0,212,255,0.15)",
                  color: "var(--neon-blue)",
                }}
              >
                Core Capabilities
              </span>
              <h2
                className="font-display font-bold text-4xl md:text-5xl"
                style={{ color: "var(--text-primary)" }}
              >
                Everything Your Emergency
                <br />
                <span className="gradient-text">Needs, Right Now</span>
              </h2>
            </motion.div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  custom={i}
                  className="feature-card glass rounded-2xl p-6"
                  style={{ border: `1px solid rgba(0,212,255,0.1)` }}
                >
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5"
                    style={{
                      background: `${f.color}15`,
                      border: `1px solid ${f.color}35`,
                      boxShadow: `0 0 20px ${f.color}20`,
                    }}
                  >
                    {f.icon}
                  </div>

                  {/* Badge */}
                  <span
                    className="inline-block text-[9px] font-display uppercase tracking-[0.18em] px-2.5 py-1 rounded mb-3"
                    style={{
                      background: `${f.color}12`,
                      border: `1px solid ${f.color}30`,
                      color: f.color,
                    }}
                  >
                    {f.badge}
                  </span>

                  <h3
                    className="font-display font-bold text-base mb-2 uppercase tracking-wide"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                  >
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimSection>
        </section>

        {/* ══════════════════════════════════════════════
            USE CASES
           ══════════════════════════════════════════════ */}
        <section className="py-20 px-6">
          <AnimSection className="max-w-5xl mx-auto text-center">
            <motion.div variants={fadeUp} className="mb-12">
              <h2
                className="font-display font-bold text-3xl md:text-4xl mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Built for <span className="gradient-text">Real Emergencies</span>
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Point. Ask. Receive expert AI guidance — anytime, anywhere.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {useCases.map((uc, i) => (
                <motion.div
                  key={uc.label}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ scale: 1.04, y: -3 }}
                  className="glass rounded-xl p-5 text-center neon-border"
                >
                  <div className="text-3xl mb-3">{uc.emoji}</div>
                  <div
                    className="font-display font-bold text-sm uppercase tracking-wide mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {uc.label}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
                  >
                    {uc.sub}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimSection>
        </section>

        {/* ══════════════════════════════════════════════
            HOW IT WORKS
           ══════════════════════════════════════════════ */}
        <section className="py-28 px-6 relative overflow-hidden">
          {/* Background radial */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)",
            }}
          />

          <AnimSection className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span
                className="inline-block text-xs font-display uppercase tracking-[0.2em] mb-4 px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(6,255,215,0.06)",
                  border: "1px solid rgba(6,255,215,0.15)",
                  color: "var(--neon-cyan)",
                }}
              >
                Workflow
              </span>
              <h2
                className="font-display font-bold text-4xl md:text-5xl"
                style={{ color: "var(--text-primary)" }}
              >
                How It <span className="gradient-text">Works</span>
              </h2>
            </motion.div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Connector line (desktop) */}
              <div
                className="absolute top-12 left-[12.5%] right-[12.5%] h-px hidden lg:block"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(0,212,255,0.3), rgba(0,212,255,0.3), transparent)",
                }}
              />

              {steps.map((s, i) => (
                <motion.div
                  key={s.n}
                  variants={fadeUp}
                  custom={i}
                  className="relative text-center px-4"
                >
                  {/* Step number circle */}
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-5">
                    <div
                      className="absolute inset-0 rounded-full animate-pulse"
                      style={{
                        background: "rgba(0,212,255,0.05)",
                        border: "1px solid rgba(0,212,255,0.15)",
                        animationDuration: `${2.5 + i * 0.5}s`,
                      }}
                    />
                    <div
                      className="absolute inset-2 rounded-full"
                      style={{
                        background: "rgba(0,212,255,0.08)",
                        border: "1px solid rgba(0,212,255,0.25)",
                      }}
                    />
                    <span
                      className="relative font-display font-black text-3xl text-glow"
                      style={{ color: "var(--neon-blue)" }}
                    >
                      {s.n}
                    </span>
                  </div>

                  <h3
                    className="font-display font-bold text-sm uppercase tracking-wide mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                  >
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimSection>
        </section>

        {/* ══════════════════════════════════════════════
            TECH STACK TICKER
           ══════════════════════════════════════════════ */}
        <section className="py-10 overflow-hidden" style={{ borderTop: "1px solid rgba(0,212,255,0.07)" }}>
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 24, ease: "linear", repeat: Infinity }}
            className="flex gap-12 whitespace-nowrap"
          >
            {[
              "Gemini 1.5 Pro",
              "Google Cloud Run",
              "Firestore",
              "Cloud Storage",
              "Vertex AI",
              "Next.js 14",
              "FastAPI",
              "Framer Motion",
              "TypeScript",
              "Python 3.11",
              "Gemini 1.5 Pro",
              "Google Cloud Run",
              "Firestore",
              "Cloud Storage",
              "Vertex AI",
              "Next.js 14",
              "FastAPI",
              "Framer Motion",
              "TypeScript",
              "Python 3.11",
            ].map((t, i) => (
              <span
                key={i}
                className="text-xs font-display uppercase tracking-[0.15em] flex items-center gap-3"
                style={{ color: "var(--text-muted)" }}
              >
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: "var(--neon-blue)", opacity: 0.5 }}
                />
                {t}
              </span>
            ))}
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════
            CTA BANNER
           ══════════════════════════════════════════════ */}
        <section className="py-28 px-6">
          <AnimSection className="max-w-3xl mx-auto text-center">
            <motion.div
              variants={fadeUp}
              className="relative glass rounded-3xl p-12 overflow-hidden"
              style={{ border: "1px solid rgba(0,212,255,0.2)" }}
            >
              {/* Glow spots */}
              <div
                className="absolute -top-20 -left-20 w-60 h-60 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
                }}
              />
              <div
                className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(6,255,215,0.06) 0%, transparent 70%)",
                }}
              />

              <motion.div variants={fadeUp} custom={0}>
                <h2
                  className="font-display font-black text-4xl md:text-5xl mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  Ready to Experience
                  <br />
                  <span className="gradient-text">AI in Action?</span>
                </h2>
              </motion.div>

              <motion.p
                variants={fadeUp}
                custom={1}
                className="text-base mb-8"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
              >
                Launch the live agent now — your camera is all you need.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={2}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Link href="/interact">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary flex items-center gap-3 px-10 py-4"
                    style={{ boxShadow: "var(--glow-lg)", fontSize: "0.8rem" }}
                  >
                    <span className="w-2 h-2 rounded-full rec-indicator" style={{ background: "currentColor" }} />
                    Launch RescueLens AI
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>
          </AnimSection>
        </section>

        {/* ══════════════════════════════════════════════
            FOOTER
           ══════════════════════════════════════════════ */}
        <footer
          className="py-10 px-6"
          style={{ borderTop: "1px solid rgba(0,212,255,0.07)" }}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span
              className="font-display font-bold text-sm tracking-widest uppercase"
              style={{ color: "var(--text-primary)" }}
            >
              Rescue<span style={{ color: "var(--neon-blue)" }}>Lens</span> AI
            </span>
            <p
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              Built with Gemini 1.5 Pro · Google Cloud · For Google Hackathon
            </p>
          </div>
        </footer>
      </main>
    </>
  );
};

export default Home;
