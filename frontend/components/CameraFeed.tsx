"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCamera, FiCameraOff, FiRefreshCw, FiZap } from "react-icons/fi";

interface CameraFeedProps {
  onCapture: (imageBase64: string) => void;
  isAnalyzing: boolean;
}

export default function CameraFeed({ onCapture, isAnalyzing }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isReady, setIsReady] = useState(false);
  const [isFirstMount, setIsFirstMount] = useState(true);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setFacingMode(isMobile ? "environment" : "user");
    setIsReady(true);
  }, []);

  // ── Start camera ──────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      setHasError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setHasError(true);
    }
  }, [facingMode]);

  // ── Stop camera ────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
    setSnapshot(null);
  }, []);

  // ── Flip camera ────────────────────────────────────
  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, [stopCamera]);

  // No auto-start: users must manually click "Enable Camera"

  useEffect(() => {
    if (!isReady) return;

    let timeout: NodeJS.Timeout;
    if (isFirstMount) {
      // Delay camera start on initial mount so Framer Motion page transition finishes smoothly.
      timeout = setTimeout(() => {
        startCamera();
        setIsFirstMount(false);
      }, 800);
    } else {
      // Start immediately on subsequent facingMode changes (e.g., flipping the camera).
      startCamera();
    }

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, isReady]);

  // ── Capture snapshot ──────────────────────────────
  const captureSnapshot = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isActive) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;

    // Mirror if front-facing
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const base64 = dataUrl.split(",")[1];
    setSnapshot(dataUrl);
    onCapture(base64);
  }, [isActive, facingMode, onCapture]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="flex flex-col gap-3">
      {/* Camera viewport */}
      <div
        className="camera-container relative w-full bg-black scan-overlay"
        style={{
          aspectRatio: "16/9",
          border: "1px solid rgba(0, 212, 255, 0.25)",
          boxShadow: isActive
            ? "0 0 30px rgba(0, 212, 255, 0.15), inset 0 0 30px rgba(0, 212, 255, 0.03)"
            : "none",
        }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{
            transform: facingMode === "user" ? "scaleX(-1)" : "none",
            display: isActive ? "block" : "none",
          }}
          playsInline
          muted
        />

        {/* Offline placeholder */}
        {!isActive && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-4xl" style={{ color: "var(--text-muted)" }}>
              <FiCamera />
            </div>
            <p
              className="text-xs font-display uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Camera Offline
            </p>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <FiCameraOff className="text-3xl" style={{ color: "var(--neon-red)" }} />
            <p className="text-xs font-mono" style={{ color: "var(--neon-red)" }}>
              Camera access denied
            </p>
            <button
              onClick={startCamera}
              className="text-xs px-4 py-2 rounded"
              style={{
                background: "rgba(255,45,85,0.1)",
                border: "1px solid rgba(255,45,85,0.4)",
                color: "var(--neon-red)",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* HUD overlay (visible when active) */}
        {isActive && (
          <>
            {/* Corner brackets */}
            <div className="camera-corner camera-corner-tl" />
            <div className="camera-corner camera-corner-tr" />
            <div className="camera-corner camera-corner-bl" />
            <div className="camera-corner camera-corner-br" />

            {/* REC badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full rec-indicator"
                style={{ background: "var(--neon-red)", boxShadow: "0 0 8px var(--neon-red)" }}
              />
              <span
                className="text-[10px] font-display uppercase tracking-widest"
                style={{ color: "var(--neon-red)" }}
              >
                Live
              </span>
            </div>

            {/* AI status */}
            <div className="absolute top-3 right-3">
              <span
                className="text-[10px] font-display uppercase tracking-widest status-online"
                style={{ color: "var(--neon-cyan)" }}
              >
                AI Vision Active
              </span>
            </div>

            {/* Scanning line */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  key="scan-line"
                  initial={{ top: "0%" }}
                  animate={{ top: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                  className="absolute left-0 right-0 h-px pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent, var(--neon-blue), transparent)",
                    boxShadow: "0 0 10px var(--neon-blue)",
                  }}
                />
              )}
            </AnimatePresence>

            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-12 h-12 opacity-20">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-neon-blue" style={{ background: "var(--neon-blue)" }} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-4" style={{ background: "var(--neon-blue)" }} />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-px" style={{ background: "var(--neon-blue)" }} />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-px" style={{ background: "var(--neon-blue)" }} />
                <div className="absolute inset-3 rounded-full border" style={{ borderColor: "var(--neon-blue)" }} />
              </div>
            </div>
          </>
        )}

        {/* Snapshot flash */}
        <AnimatePresence>
          {snapshot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-white pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex items-center gap-2">
        {isActive ? (
          <>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={captureSnapshot}
              disabled={isAnalyzing}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5"
            >
              <FiZap />
              <span>{isAnalyzing ? "Analyzing…" : "Analyze Frame"}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={flipCamera}
              className="p-2.5 rounded"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-secondary)",
              }}
              title="Flip camera"
            >
              <FiRefreshCw />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopCamera}
              className="p-2.5 rounded"
              style={{
                background: "rgba(255,45,85,0.08)",
                border: "1px solid rgba(255,45,85,0.25)",
                color: "var(--neon-red)",
              }}
              title="Stop camera"
            >
              <FiCameraOff />
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={startCamera}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5"
          >
            <FiCamera />
            <span>Enable Camera</span>
          </motion.button>
        )}
      </div>

      {/* Last capture preview */}
      <AnimatePresence>
        {snapshot && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <div
              className="px-3 py-1.5 flex items-center justify-between text-[10px] font-display uppercase tracking-widest"
              style={{
                background: "rgba(0,212,255,0.06)",
                color: "var(--neon-blue)",
              }}
            >
              <span>Last Capture</span>
              <button
                onClick={() => setSnapshot(null)}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
            <img src={snapshot} alt="Snapshot" className="w-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
