import React, { useEffect, useRef, useState, useCallback } from "react";
import { TourStep } from "../hooks/useTour";

interface Rect { top: number; left: number; width: number; height: number; bottom: number; right: number }

type Props = {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  onFinish: () => void;
};

const CARD_W = 390;
const CARD_H_APPROX = 460;
const PAD = 12;

function getCardPosition(rect: Rect): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Vertical: prefer below, fallback above
  let top: number;
  const spaceBelow = vh - rect.bottom - PAD;
  const spaceAbove = rect.top - PAD;
  if (spaceBelow >= CARD_H_APPROX || spaceBelow >= spaceAbove) {
    top = rect.bottom + PAD;
  } else {
    top = Math.max(PAD, rect.top - CARD_H_APPROX - PAD);
  }
  top = Math.min(top, vh - CARD_H_APPROX - PAD);
  top = Math.max(top, PAD);

  // Horizontal: align with element, keep in viewport
  let left = rect.left;
  if (left + CARD_W > vw - PAD) left = vw - CARD_W - PAD;
  if (left < PAD) left = PAD;

  return { top, left };
}

export function TourOverlay({ isActive, currentStep, steps, onNext, onPrev, onExit, onFinish }: Props) {
  const [highlight, setHighlight] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [animKey, setAnimKey] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const updateHighlight = useCallback(() => {
    if (!isActive) return;
    const step = steps[currentStep];
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setHighlight(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const rect: Rect = { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
    setHighlight(rect);
    setCardPos(getCardPosition(rect));
    setAnimKey((k) => k + 1);
  }, [isActive, currentStep, steps]);

  useEffect(() => {
    if (!isActive) { setHighlight(null); return; }
    const step = steps[currentStep];
    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Wait for scroll to settle
      const t = setTimeout(updateHighlight, 420);
      return () => clearTimeout(t);
    } else {
      updateHighlight();
    }
  }, [isActive, currentStep, steps, updateHighlight]);

  // Re-calc on resize
  useEffect(() => {
    if (!isActive) return;
    const onResize = () => updateHighlight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isActive, updateHighlight]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (currentStep < steps.length - 1) onNext();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") onPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, currentStep, steps.length, onNext, onPrev, onExit]);

  if (!isActive || !highlight) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLast = currentStep === steps.length - 1;

  const gx = highlight.left - 8;
  const gy = highlight.top - 8;
  const gw = highlight.width + 16;
  const gh = highlight.height + 16;

  return (
    <>
      {/* ── Dark backdrop with spotlight cutout ─────────────────────────── */}
      <div
        onClick={onExit}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(2.5px)",
          WebkitBackdropFilter: "blur(2.5px)",
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
            ${gx}px ${gy}px,
            ${gx}px ${gy + gh}px,
            ${gx + gw}px ${gy + gh}px,
            ${gx + gw}px ${gy}px,
            ${gx}px ${gy}px
          )`,
          transition: "clip-path 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      />

      {/* ── Lime highlight ring ──────────────────────────────────────────── */}
      <div
        key={`ring-${animKey}`}
        style={{
          position: "fixed",
          top: gy, left: gx,
          width: gw, height: gh,
          border: "2px solid #C8F05A",
          boxShadow: "0 0 0 4px rgba(200,240,90,0.12), 0 0 48px rgba(200,240,90,0.18)",
          borderRadius: 6,
          zIndex: 10001,
          pointerEvents: "none",
          transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      />

      {/* ── Story Card ──────────────────────────────────────────────────── */}
      <div
        ref={cardRef}
        key={`card-${animKey}`}
        style={{
          position: "fixed",
          top: cardPos.top,
          left: cardPos.left,
          width: CARD_W,
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 6,
          zIndex: 10002,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          animation: "tour-card-in 0.35s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <style>{`
          @keyframes tour-card-in {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Progress bar */}
        <div style={{ height: 2, background: "#1E1E1E" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "#C8F05A",
            transition: "width 0.4s ease",
          }} />
        </div>

        <div style={{ padding: "20px 22px 22px" }}>
          {/* Step counter */}
          <div style={{
            fontFamily: "'Geist Mono','DM Mono',monospace",
            fontSize: 10, letterSpacing: "0.14em",
            color: "#444", marginBottom: 14, textTransform: "uppercase",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>Step {currentStep + 1} of {steps.length}</span>
            <button
              onClick={onExit}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#444", fontSize: 16, padding: "0 2px",
                lineHeight: 1, transition: "color 0.15s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#444")}
              title="Exit tour (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Title */}
          <div style={{
            fontSize: 17, fontWeight: 600, color: "#FAFAF7",
            lineHeight: 1.32, marginBottom: 18,
            fontFamily: "'Geist','Inter',system-ui,sans-serif",
          }}>
            {step.icon}&nbsp;&nbsp;{step.title}
          </div>

          {/* Where from */}
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: "'Geist Mono','DM Mono',monospace",
              fontSize: 9, letterSpacing: "0.13em", textTransform: "uppercase",
              color: "#555", marginBottom: 5,
            }}>
              📊&nbsp; Where this comes from
            </div>
            <div style={{
              fontSize: 12.5, color: "#888",
              lineHeight: 1.72, fontFamily: "'Geist','Inter',system-ui,sans-serif",
            }}>
              {step.whereFrom}
            </div>
          </div>

          {/* Why matters */}
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: "'Geist Mono','DM Mono',monospace",
              fontSize: 9, letterSpacing: "0.13em", textTransform: "uppercase",
              color: "#555", marginBottom: 5,
            }}>
              🎯&nbsp; Why it matters
            </div>
            <div style={{
              fontSize: 12.5, color: "#BBBBBB",
              lineHeight: 1.72, fontFamily: "'Geist','Inter',system-ui,sans-serif",
            }}>
              {step.whyMatters}
            </div>
          </div>

          {/* What to do */}
          <div style={{
            background: "rgba(200,240,90,0.06)",
            border: "1px solid rgba(200,240,90,0.14)",
            borderRadius: 4, padding: "11px 14px", marginBottom: 20,
          }}>
            <div style={{
              fontFamily: "'Geist Mono','DM Mono',monospace",
              fontSize: 9, letterSpacing: "0.13em", textTransform: "uppercase",
              color: "#C8F05A", marginBottom: 5,
            }}>
              ✅&nbsp; What to do
            </div>
            <div style={{
              fontSize: 12.5, color: "#E8E8E8",
              lineHeight: 1.72, fontFamily: "'Geist','Inter',system-ui,sans-serif",
            }}>
              {step.whatToDo}
            </div>
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={onPrev}
              disabled={currentStep === 0}
              style={{
                background: "transparent",
                border: "1px solid",
                borderColor: currentStep === 0 ? "#222" : "#333",
                color: currentStep === 0 ? "#2A2A2A" : "#666",
                padding: "8px 16px", borderRadius: 4,
                cursor: currentStep === 0 ? "not-allowed" : "pointer",
                fontFamily: "'Geist','Inter',system-ui,sans-serif",
                fontSize: 13, fontWeight: 500,
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseOver={(e) => {
                if (currentStep > 0) {
                  e.currentTarget.style.borderColor = "#555";
                  e.currentTarget.style.color = "#999";
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = currentStep === 0 ? "#222" : "#333";
                e.currentTarget.style.color = currentStep === 0 ? "#2A2A2A" : "#666";
              }}
            >
              ← Previous
            </button>

            <button
              onClick={isLast ? onFinish : onNext}
              style={{
                background: "#C8F05A",
                border: "none",
                color: "#0A0A0A",
                fontWeight: 700,
                padding: "8px 22px",
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: "'Geist','Inter',system-ui,sans-serif",
                fontSize: 13,
                transition: "opacity 0.15s, transform 0.15s",
                letterSpacing: "0.01em",
              }}
              onMouseOver={(e) => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              {isLast ? "Finish Tour ✓" : "Next Step →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
