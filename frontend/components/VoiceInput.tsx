"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMic, FiMicOff, FiSend } from "react-icons/fi";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

// Number of waveform bars
const BAR_COUNT = 28;

export default function VoiceInput({ onTranscript, isProcessing }: VoiceInputProps) {
  const [isListening, setIsListening]   = useState(false);
  const [transcript, setTranscript]     = useState("");
  const [interim, setInterim]           = useState("");
  const [supported, setSupported]       = useState(true);
  const [barHeights, setBarHeights]     = useState<number[]>(Array(BAR_COUNT).fill(0.2));

  const recogRef   = useRef<any>(null);
  const animRef    = useRef<number>(0);
  const gainRef    = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Check support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) setSupported(false);
  }, []);

  // Animate waveform bars from analyser data
  const animateWaveform = useCallback(() => {
    if (analyserRef.current) {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);

      const step = Math.floor(data.length / BAR_COUNT);
      const heights = Array.from({ length: BAR_COUNT }, (_, i) => {
        const val = data[i * step] / 255;
        return Math.max(0.08, val);
      });
      setBarHeights(heights);
    } else {
      // Idle animation
      setBarHeights((prev) =>
        prev.map(() => 0.08 + Math.random() * 0.15)
      );
    }
    animRef.current = requestAnimationFrame(animateWaveform);
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Set up AudioContext analyser for real waveform
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const audioCtx = new AudioContext();
      const source   = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch {
      // Fallback: random animation
    }

    const recog = new SpeechRecognition();
    recog.continuous      = true;
    recog.interimResults  = true;
    recog.lang            = "en-US";

    recog.onresult = (e: any) => {
      let final = "";
      let inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else inter += e.results[i][0].transcript;
      }
      if (final) setTranscript((prev) => prev + " " + final);
      setInterim(inter);
    };

    recog.onerror = () => stopListening();
    recog.start();
    recogRef.current = recog;
    setIsListening(true);
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animateWaveform);
  }, [animateWaveform]);

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    recogRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    analyserRef.current = null;
    cancelAnimationFrame(animRef.current);
    setBarHeights(Array(BAR_COUNT).fill(0.15));
    setIsListening(false);
    setInterim("");
  }, []);

  const submit = useCallback(() => {
    const text = (transcript + " " + interim).trim();
    if (!text) return;
    stopListening();
    onTranscript(text);
    setTranscript("");
    setInterim("");
  }, [transcript, interim, onTranscript, stopListening]);

  // Cleanup
  useEffect(() => () => {
    cancelAnimationFrame(animRef.current);
    stopListening();
  }, [stopListening]);

  const displayText = transcript + (interim ? ` ${interim}` : "");

  return (
    <div
      className="glass rounded-xl p-4 flex flex-col gap-4"
      style={{ border: "1px solid rgba(0,212,255,0.12)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-xs font-display uppercase tracking-widest"
          style={{ color: "var(--neon-blue)" }}
        >
          Voice Input
        </h3>
        <span
          className="text-[10px] font-mono"
          style={{ color: isListening ? "var(--neon-cyan)" : "var(--text-muted)" }}
        >
          {isListening ? "● Listening" : "● Standby"}
        </span>
      </div>

      {/* Waveform */}
      <div
        className="flex items-center justify-center gap-0.5 rounded-lg py-5 px-4"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(0,212,255,0.07)",
          minHeight: "70px",
        }}
      >
        {barHeights.map((h, i) => (
          <motion.div
            key={i}
            className="waveform-bar rounded-full"
            animate={{ scaleY: isListening ? h * 3 + 0.1 : 0.15 }}
            transition={{
              duration: 0.1,
              delay: isListening ? 0 : (i / BAR_COUNT) * 0.8,
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
            style={{
              width: "3px",
              height: "40px",
              transformOrigin: "center",
              background: isListening
                ? `hsl(${190 + h * 30}, 100%, ${60 + h * 20}%)`
                : "rgba(0,212,255,0.2)",
            }}
          />
        ))}
      </div>

      {/* Transcript display */}
      <AnimatePresence>
        {displayText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg p-3"
            style={{
              background: "rgba(0,212,255,0.04)",
              border: "1px solid rgba(0,212,255,0.12)",
            }}
          >
            <p
              className="text-sm font-mono leading-relaxed"
              style={{ color: "var(--text-primary)" }}
            >
              {transcript}
              {interim && (
                <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                  {" "}{interim}
                </span>
              )}
              <span
                className="animate-pulse ml-0.5"
                style={{ color: "var(--neon-blue)" }}
              >
                |
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!supported ? (
          <p className="text-xs font-mono w-full text-center" style={{ color: "var(--neon-red)" }}>
            Speech recognition not supported in this browser
          </p>
        ) : (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-display uppercase tracking-wider transition-all duration-300"
              style={{
                background: isListening
                  ? "rgba(255,45,85,0.12)"
                  : "rgba(0,212,255,0.1)",
                border: isListening
                  ? "1px solid rgba(255,45,85,0.5)"
                  : "1px solid rgba(0,212,255,0.4)",
                color: isListening ? "var(--neon-red)" : "var(--neon-blue)",
                boxShadow: isListening ? "var(--glow-red)" : "none",
              }}
            >
              {isListening ? (
                <>
                  <FiMicOff className="text-base" />
                  Stop
                </>
              ) : (
                <>
                  <FiMic className="text-base" />
                  Start Listening
                </>
              )}
            </motion.button>

            {displayText && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={submit}
                disabled={isProcessing}
                className="p-2.5 rounded-lg"
                style={{
                  background: "rgba(6,255,215,0.1)",
                  border: "1px solid rgba(6,255,215,0.4)",
                  color: "var(--neon-cyan)",
                }}
              >
                <FiSend />
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
