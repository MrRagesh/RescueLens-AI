import type { AppProps } from "next/app";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import { Orbitron, Syne, JetBrains_Mono } from "next/font/google";
import "../styles/globals.css";

// ── Font configuration ──────────────────────────────
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

// ── Page transition variants ─────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.3, ease: "easeIn" } },
};

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <div
      className={`${orbitron.variable} ${syne.variable} ${jetbrains.variable}`}
    >
      <Head>
        <title>RescueLens AI</title>
        <link rel="icon" type="image/png"  href="/favicon.png" />
      </Head>
      <AnimatePresence mode="wait">
        <motion.div
          key={router.route}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
