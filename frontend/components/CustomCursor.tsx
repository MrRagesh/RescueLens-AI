"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top  = `${e.clientY}px`;
      }
    };

    // Smooth ring tracking via lerp
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const animateRing = () => {
      ringPos.current.x = lerp(ringPos.current.x, mousePos.current.x, 0.12);
      ringPos.current.y = lerp(ringPos.current.y, mousePos.current.y, 0.12);
      if (ringRef.current) {
        ringRef.current.style.left = `${ringPos.current.x}px`;
        ringRef.current.style.top  = `${ringPos.current.y}px`;
      }
      rafRef.current = requestAnimationFrame(animateRing);
    };
    rafRef.current = requestAnimationFrame(animateRing);

    // Detect hover on interactive elements
    const onMouseEnter = () => setIsHovering(true);
    const onMouseLeave = () => setIsHovering(false);
    const interactables = document.querySelectorAll(
      "a, button, [role='button'], input, textarea, select, .feature-card"
    );
    interactables.forEach((el) => {
      el.addEventListener("mouseenter", onMouseEnter);
      el.addEventListener("mouseleave", onMouseLeave);
    });

    // Click ripple
    const onClick = (e: MouseEvent) => {
      setIsClicking(true);
      if (rippleRef.current) {
        rippleRef.current.style.left = `${e.clientX}px`;
        rippleRef.current.style.top  = `${e.clientY}px`;
        rippleRef.current.style.transform = "translate(-50%, -50%) scale(0)";
        rippleRef.current.style.opacity   = "1";
        rippleRef.current.style.transition = "none";

        requestAnimationFrame(() => {
          if (rippleRef.current) {
            rippleRef.current.style.transition =
              "transform 0.6s ease-out, opacity 0.6s ease-out";
            rippleRef.current.style.transform = "translate(-50%, -50%) scale(2)";
            rippleRef.current.style.opacity   = "0";
          }
        });
      }
      setTimeout(() => setIsClicking(false), 200);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(rafRef.current);
      interactables.forEach((el) => {
        el.removeEventListener("mouseenter", onMouseEnter);
        el.removeEventListener("mouseleave", onMouseLeave);
      });
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{
          width:   isClicking ? "4px"  : isHovering ? "12px" : "8px",
          height:  isClicking ? "4px"  : isHovering ? "12px" : "8px",
          opacity: isClicking ? 0.5 : 1,
          transition: "width 0.15s, height 0.15s, opacity 0.15s",
        }}
      />

      {/* Ring */}
      <div
        ref={ringRef}
        className="cursor-ring"
        style={{
          width:       isHovering ? "56px"                         : "36px",
          height:      isHovering ? "56px"                         : "36px",
          borderColor: isHovering ? "rgba(0, 212, 255, 0.9)"       : "rgba(0, 212, 255, 0.6)",
          background:  isHovering ? "rgba(0, 212, 255, 0.04)"      : "transparent",
          boxShadow:   isHovering ? "0 0 20px rgba(0,212,255,0.3)" : "none",
        }}
      />

      {/* Ripple */}
      <div ref={rippleRef} className="cursor-ripple" />
    </>
  );
}
