import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";

// ─── Font aliases — match the rest of the app ─────────────────────────────────
const F = {
  serif: "'DM Serif Display', Georgia, serif",
  sans:  "'Geist', 'Inter', system-ui, sans-serif",
  mono:  "'Geist Mono', 'DM Mono', monospace",
};

// ─── Palette ──────────────────────────────────────────────────────────────────
const LIME = "#C8F05A";
const BG   = "#080808";
const BG2  = "#0D0D0D";

// ─── Grain noise SVG ──────────────────────────────────────────────────────────
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

// ─── Ticker items ──────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  "ETH SCORE  94.2 ↑",
  "ACTIVE NODES  12,847",
  "ALERTS TODAY  3",
  "AVG LEAD TIME  4.2d",
  "CO₂ SAVED  1.2M kg",
  "COMPLIANCE RATE  97.8%",
  "CHAIN COVERAGE  340+ enterprises",
  "UPTIME  99.7%",
  "RISK ZONES MONITORED  47 countries",
  "SUPPLIERS TRACKED  12,000+",
];

// ─── Intersection observer ─────────────────────────────────────────────────────
function useInView(ref: React.RefObject<Element>, once = true) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVisible(true); if (once) obs.disconnect(); }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, once]);
  return visible;
}

// ─── Counter animation ─────────────────────────────────────────────────────────
function useCounter(target: number, visible: boolean, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setVal(Math.floor(eased * target));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target, duration]);
  return val;
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
const MiniChart = ({ animated }: { animated: boolean }) => {
  const bars = [42, 65, 38, 78, 55, 90, 72, 84, 61, 95, 70, 88];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 56, padding: "0 2px" }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          flex: 1,
          background: i === bars.length - 1 ? LIME : i % 3 === 0 ? "rgba(200,240,90,0.4)" : "rgba(255,255,255,0.10)",
          borderRadius: "2px 2px 0 0",
          height: animated ? `${h}%` : "0%",
          transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${i * 45}ms`,
        }} />
      ))}
    </div>
  );
};

// ─── Dashboard preview card ────────────────────────────────────────────────────
const DashPreview = () => {
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setChartReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  const metrics = [
    { label: "COMPLIANCE", value: "94.2", unit: "%", delta: "+1.2", up: true },
    { label: "ACTIVE ALERTS", value: "3", unit: "", delta: "-2", up: true },
    { label: "CHAIN NODES", value: "12.8K", unit: "", delta: "+240", up: true },
    { label: "RISK INDEX", value: "0.18", unit: "", delta: "-0.04", up: true },
  ];

  const suppliers = [
    { name: "Acme Materials", country: "DE", score: 94, status: "Active" },
    { name: "Pacific Logistics", country: "SG", score: 82, status: "Review" },
    { name: "Nordic Textiles", country: "SE", score: 91, status: "Active" },
    { name: "Gulf Components", country: "AE", score: 63, status: "Alert" },
  ];

  const scoreColor = (s: number) => s >= 85 ? LIME : s >= 70 ? "#FBBF24" : "#E84545";

  return (
    <div style={{
      background: "#0D0D0D",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 6,
      padding: "20px",
      fontFamily: F.mono,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
        background: "linear-gradient(90deg, transparent, rgba(200,240,90,0.6), transparent)",
      }} />

      {/* Live badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "3px 10px", borderRadius: 99,
        border: "1px solid rgba(200,240,90,0.25)",
        background: "rgba(200,240,90,0.07)",
        marginBottom: 16,
      }}>
        <span style={{
          height: 6, width: 6, borderRadius: "50%", background: LIME,
          boxShadow: `0 0 6px ${LIME}`,
          animation: "lp-blink 1.5s ease-in-out infinite",
        }} />
        <span style={{ fontSize: 10, color: LIME, letterSpacing: "0.12em", fontFamily: F.mono }}>
          LIVE — Updated 2m ago
        </span>
      </div>

      {/* Metric tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 4, padding: "10px 12px",
          }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.10em", fontFamily: F.mono, marginBottom: 4 }}>
              {m.label}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 300, color: "#F5F5F0", letterSpacing: "-0.03em", fontFamily: F.mono }}>{m.value}</span>
              {m.unit && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{m.unit}</span>}
            </div>
            <div style={{ fontSize: 10, color: m.up ? LIME : "#E84545", marginTop: 2, fontFamily: F.mono }}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Mini chart */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 4, padding: "10px 12px 8px", marginBottom: 12,
      }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.10em", fontFamily: F.mono, marginBottom: 8 }}>
          ESG COMPLIANCE TREND
        </div>
        <MiniChart animated={chartReady} />
      </div>

      {/* Supplier mini table */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {suppliers.map((s) => (
          <div key={s.name} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "7px 10px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: 3,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                height: 20, width: 24, display: "inline-flex", alignItems: "center",
                justifyContent: "center", borderRadius: 2,
                background: "rgba(255,255,255,0.06)",
                fontSize: 9, color: "rgba(255,255,255,0.5)", fontFamily: F.mono,
              }}>{s.country}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: F.mono }}>{s.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: scoreColor(s.score), fontFamily: F.mono }}>{s.score}</span>
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 2, fontFamily: F.mono, letterSpacing: "0.08em",
                color: s.status === "Active" ? LIME : s.status === "Alert" ? "#E84545" : "#FBBF24",
                background: s.status === "Active" ? "rgba(200,240,90,0.10)" : s.status === "Alert" ? "rgba(232,69,69,0.10)" : "rgba(251,191,36,0.10)",
                border: `1px solid ${s.status === "Active" ? "rgba(200,240,90,0.20)" : s.status === "Alert" ? "rgba(232,69,69,0.20)" : "rgba(251,191,36,0.20)"}`,
              }}>
                {s.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
const Reveal = ({ children, delay = 0, style = {}, className = "" }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null!);
  const visible = useInView(ref);
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
};

// ─── Animated number counter ──────────────────────────────────────────────────
const StatNum = ({ target, suffix = "", prefix = "", visible }: { target: number; suffix?: string; prefix?: string; visible: boolean }) => {
  const val = useCounter(target, visible);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HomePage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [ring, setRing] = useState({ x: -100, y: -100 });
  const ringRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);
  const numbersRef = useRef<HTMLDivElement>(null!);
  const numbersVisible = useInView(numbersRef);
  const [emailVal, setEmailVal] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    setCursor({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      ringRef.current.x = lerp(ringRef.current.x, cursor.x, 0.12);
      ringRef.current.y = lerp(ringRef.current.y, cursor.y, 0.12);
      setRing({ x: ringRef.current.x, y: ringRef.current.y });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [onMouseMove, cursor.x, cursor.y]);

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    const val = emailVal.trim();
    if (!val) {
      setEmailError("Please enter your work email.");
      return;
    }
    // simple email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(val)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    // TODO: hook up to API — for now show an in-place success message
    setEmailSubmitted(true);
    setEmailVal("");
  };

  return (
    <>
      {/* ── Global styles ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes lp-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes lp-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes lp-pulse-ring {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
        @keyframes lp-fadeup {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: rgba(200,240,90,0.2); border-radius: 99px; }

        /* ── Feature / How-card styles ── */
        .lp-feature-card {
          border: 1px solid rgba(255,255,255,0.06);
          transition: border-color 0.3s ease, background 0.3s ease;
        }
        .lp-feature-card:hover {
          border-color: rgba(200,240,90,0.28);
          background: rgba(200,240,90,0.02) !important;
        }
        .lp-how-card {
          border: 1px solid rgba(255,255,255,0.05);
          background: #0D0D0D;
          transition: border-color 0.3s ease;
          position: relative;
        }
        .lp-how-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: #C8F05A;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .lp-how-card:hover::before { transform: scaleX(1); }
        .lp-how-card:hover { border-color: rgba(200,240,90,0.18); }

        /* ── Nav links ── */
        .lp-nav-link {
          font-family: 'Geist', 'Inter', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: color 0.2s;
        }
        .lp-nav-link:hover { color: rgba(255,255,255,0.9); }

        /* ── CTA buttons ── */
        .lp-cta-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 24px;
          border: 1px solid rgba(200,240,90,0.5);
          border-radius: 2px;
          font-family: 'Geist', 'Inter', system-ui, sans-serif;
          font-size: 13px; font-weight: 600;
          letter-spacing: 0.03em;
          color: #C8F05A;
          text-decoration: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          white-space: nowrap;
        }
        .lp-cta-outline:hover { background: #C8F05A; color: #080808; }
        .lp-cta-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 24px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 2px;
          font-family: 'Geist', 'Inter', system-ui, sans-serif;
          font-size: 13px; font-weight: 600;
          letter-spacing: 0.03em;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          background: transparent;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          white-space: nowrap;
        }
        .lp-cta-ghost:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.9); }

        /* ── Layout classes — desktop defaults ── */
        .lp-nav-inner {
          display: flex; align-items: center; justify-content: space-between;
          height: 60px; padding: 0 48px; max-width: 1440px; margin: 0 auto;
        }
        .lp-nav-links { display: flex; align-items: center; gap: 32px; }
        .lp-nav-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
        .lp-mobile-menu {
          display: none; flex-direction: column; gap: 0;
          position: fixed; top: 60px; left: 0; right: 0; z-index: 99;
          background: rgba(8,8,8,0.97); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 16px 0;
        }
        .lp-mobile-menu.open { display: flex; }
        .lp-mobile-menu a {
          font-family: 'Geist', sans-serif; font-size: 15px; font-weight: 500;
          color: rgba(255,255,255,0.6); text-decoration: none;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: color 0.2s, background 0.2s;
        }
        .lp-mobile-menu a:hover { color: #fff; background: rgba(255,255,255,0.03); }
        .lp-mobile-menu .lp-mobile-cta {
          margin: 12px 24px 4px;
          padding: 12px 20px;
          border: 1px solid rgba(200,240,90,0.5);
          border-radius: 2px;
          color: #C8F05A;
          text-align: center;
          font-weight: 600;
        }

        .lp-hero {
          min-height: 100vh;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
          padding: 120px 80px 80px;
          position: relative; overflow: hidden;
        }
        .lp-hero-right { position: relative; z-index: 1; }

        .lp-section-pad { padding: 120px 80px; }

        .lp-how-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: rgba(255,255,255,0.05);
        }

        .lp-features-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          grid-template-rows: auto auto auto;
          gap: 8px;
        }
        .lp-features-big { grid-row: 1 / 4; }

        .lp-numbers-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .lp-number-cell {
          padding: 64px 40px;
        }
        .lp-number-cell:not(:last-child) {
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .lp-cta-split { display: grid; grid-template-columns: 1fr 1fr; min-height: 360px; }
        .lp-cta-dark { padding: 80px; display: flex; flex-direction: column; justify-content: center; background: #0D0D0D; }
        .lp-cta-lime { padding: 80px; display: flex; flex-direction: column; justify-content: center; background: #C8F05A; }

        .lp-footer-inner {
          padding: 32px 80px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 20px;
        }
        .lp-footer-links { display: flex; gap: 32px; }

        /* ── Tablet (≤1024px) ── */
        @media (max-width: 1024px) {
          .lp-nav-inner { padding: 0 28px; }
          .lp-nav-links { gap: 20px; }
          .lp-hero { grid-template-columns: 1fr; gap: 48px; padding: 100px 40px 60px; }
          .lp-hero-right { max-width: 560px; }
          .lp-section-pad { padding: 80px 40px; }
          .lp-how-grid { grid-template-columns: 1fr; }
          .lp-features-grid { grid-template-columns: 1fr; grid-template-rows: auto; }
          .lp-features-big { grid-row: auto; }
          .lp-numbers-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-number-cell:nth-child(2) { border-right: none; }
          .lp-number-cell:nth-child(3) { border-right: 1px solid rgba(255,255,255,0.06); }
          .lp-number-cell { padding: 48px 32px; }
          .lp-cta-split { grid-template-columns: 1fr; }
          .lp-cta-dark { padding: 60px 40px; }
          .lp-cta-lime { padding: 60px 40px; }
          .lp-footer-inner { padding: 28px 40px; }
        }

        /* ── Mobile (≤640px) ── */
        @media (max-width: 640px) {
          .lp-nav-links { display: none; }
          .lp-nav-hamburger { display: flex; align-items: center; }
          .lp-nav-cta { display: none; }
          .lp-hero { padding: 80px 20px 48px; gap: 36px; }
          .lp-hero-right { display: none; }
          .lp-section-pad { padding: 64px 20px; }
          .lp-numbers-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-number-cell { padding: 36px 16px; }
          .lp-number-cell:nth-child(2) { border-right: none; }
          .lp-number-cell:nth-child(3) { border-right: 1px solid rgba(255,255,255,0.06); }
          .lp-cta-dark { padding: 48px 20px; }
          .lp-cta-lime { padding: 48px 20px; }
          .lp-footer-inner { padding: 24px 20px; flex-direction: column; align-items: flex-start; }
          .lp-footer-links { flex-wrap: wrap; gap: 16px; }
        }
      `}</style>

      {/* ── Grain overlay ──────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 999, pointerEvents: "none",
        opacity: 0.025,
        backgroundImage: GRAIN_SVG,
        backgroundSize: "128px 128px",
        backgroundRepeat: "repeat",
      }} />

      {/* ── Custom cursor (desktop only) ──────────────────────────────────── */}
      <div style={{
        position: "fixed", zIndex: 10000, pointerEvents: "none",
        width: 6, height: 6, borderRadius: "50%",
        background: LIME,
        left: cursor.x, top: cursor.y,
        transform: "translate(-50%, -50%)",
        transition: "left 0.05s, top 0.05s",
        mixBlendMode: "difference",
      }} />
      <div style={{
        position: "fixed", zIndex: 9999, pointerEvents: "none",
        width: 28, height: 28, borderRadius: "50%",
        border: `1px solid ${LIME}60`,
        left: ring.x, top: ring.y,
        transform: "translate(-50%, -50%)",
      }} />

      <div style={{ background: BG, color: "#F5F5F0", minHeight: "100vh", overflowX: "hidden" }}>

        {/* ═══════════════════════════════════════════════
            1. NAV
        ═══════════════════════════════════════════════ */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: scrolled ? "rgba(8,8,8,0.90)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
          transition: "all 0.35s ease",
        }}>
          <div className="lp-nav-inner">
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ fontFamily: F.serif, fontSize: 21, letterSpacing: "-0.02em", color: "#F5F5F0" }}>
                OptiSupply
              </span>
              <div style={{ position: "relative", width: 8, height: 8 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: LIME, animation: "lp-blink 2s ease-in-out infinite" }} />
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "transparent", border: `1px solid ${LIME}`,
                  animation: "lp-pulse-ring 2s ease-out infinite",
                }} />
              </div>
            </div>

            {/* Desktop links */}
            <div className="lp-nav-links">
              <a href="#how-it-works" className="lp-nav-link">How It Works</a>
              <a href="#features" className="lp-nav-link">Features</a>
              <a href="#numbers" className="lp-nav-link">Numbers</a>
              <Link to="/dashboard" className="lp-cta-outline lp-nav-cta" style={{ padding: "8px 18px", fontSize: 12 }}>
                Launch App →
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lp-nav-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                {menuOpen ? (
                  <path d="M5 5l12 12M17 5L5 17" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                ) : (
                  <>
                    <line x1="3" y1="7" x2="19" y2="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="3" y1="12" x2="19" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="3" y1="17" x2="19" y2="17" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* Mobile dropdown menu */}
          <div className={`lp-mobile-menu${menuOpen ? " open" : ""}`}>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#numbers" onClick={() => setMenuOpen(false)}>Numbers</a>
            <Link to="/dashboard" className="lp-mobile-cta" onClick={() => setMenuOpen(false)}>
              Launch App →
            </Link>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════════
            2. HERO
        ═══════════════════════════════════════════════ */}
        <section className="lp-hero">
          {/* BG bloom */}
          <div style={{
            position: "absolute", top: "-20%", right: "-10%",
            width: 600, height: 600,
            background: "radial-gradient(circle, rgba(200,240,90,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Left */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 12, color: LIME,
              letterSpacing: "0.12em", marginBottom: 28,
              opacity: 0, animation: "lp-fadeup 0.7s ease 0.1s forwards",
            }}>
              — Ethical Supply Chain Intelligence
            </div>

            <h1 style={{
              fontFamily: F.serif, fontSize: "clamp(44px, 5.5vw, 84px)",
              lineHeight: 0.94, letterSpacing: "-0.02em",
              margin: 0, marginBottom: 28,
              opacity: 0, animation: "lp-fadeup 0.8s ease 0.2s forwards",
            }}>
              <span style={{ display: "block" }}>Track Every</span>
              <span style={{ display: "block", fontStyle: "italic" }}>Supplier,</span>
              <span style={{ display: "block" }}>
                Score Every{" "}
                <span style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(240,237,230,0.3)" }}>
                  Risk.
                </span>
              </span>
            </h1>

            <p style={{
              fontFamily: F.sans, fontSize: "clamp(14px, 1.5vw, 16px)", lineHeight: 1.65,
              color: "rgba(255,255,255,0.45)", maxWidth: 460,
              marginBottom: 40,
              opacity: 0, animation: "lp-fadeup 0.8s ease 0.35s forwards",
            }}>
              OptiSupply turns supply chain complexity into clarity — real-time ESG scoring,
              geo-risk intelligence, and AI-driven supplier recommendations in one command center.
            </p>

            <div style={{
              display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 52,
              opacity: 0, animation: "lp-fadeup 0.8s ease 0.5s forwards",
            }}>
              <Link to="/dashboard" className="lp-cta-outline">Get Started →</Link>
              <a href="#how-it-works" className="lp-cta-ghost">See How It Works</a>
            </div>

            {/* Hero stats strip */}
            <div style={{
              paddingTop: 36,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24,
              opacity: 0, animation: "lp-fadeup 0.8s ease 0.65s forwards",
            }}>
              {[
                { num: "94%", label: "Supplier Compliance" },
                { num: "12B+", label: "Supply Nodes" },
                { num: "<2h", label: "Response Time" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: F.serif, fontSize: "clamp(26px, 3vw, 38px)", letterSpacing: "-0.03em", lineHeight: 1, fontStyle: "italic", color: "#F5F5F0" }}>
                    {s.num}
                  </div>
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.10em", marginTop: 6 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard preview */}
          <div
            className="lp-hero-right"
            style={{ opacity: 0, animation: "lp-fadeup 0.9s ease 0.45s forwards" }}
          >
            <DashPreview />
            <div style={{
              position: "absolute", inset: -1, borderRadius: 7, pointerEvents: "none",
              background: `linear-gradient(135deg, ${LIME}15, transparent 60%)`,
              zIndex: -1,
            }} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            3. TICKER
        ═══════════════════════════════════════════════ */}
        <div style={{
          background: BG2,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden", height: 42,
          display: "flex", alignItems: "center",
        }}>
          <div style={{ display: "flex", animation: "lp-ticker 38s linear infinite", whiteSpace: "nowrap" }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.10em", color: "rgba(255,255,255,0.40)", paddingRight: 64 }}>
                <span style={{ color: LIME, marginRight: 8 }}>◆</span>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            4. HOW IT WORKS
        ═══════════════════════════════════════════════ */}
        <section id="how-it-works" className="lp-section-pad" style={{ background: BG2 }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
              <div style={{ width: 28, height: 1, background: LIME }} />
              <span style={{ fontFamily: F.mono, fontSize: 11, color: LIME, letterSpacing: "0.12em" }}>PROCESS</span>
            </div>
            <h2 style={{ fontFamily: F.serif, fontSize: "clamp(32px, 4vw, 52px)", fontStyle: "italic", letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0, marginBottom: 56 }}>
              Three steps to complete<br />supply chain clarity.
            </h2>
          </Reveal>

          <div className="lp-how-grid">
            {[
              {
                step: "01",
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7z"/><path d="M9 12l2 2 4-4"/></svg>,
                title: "Connect Your Suppliers",
                desc: "Import your supplier list via CSV, API, or manual entry. OptiSupply maps every node in your chain within minutes.",
              },
              {
                step: "02",
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14"/></svg>,
                title: "Score & Analyze",
                desc: "Our AI engine scores each supplier across Environmental, Social and Governance pillars — updated in real time with geo-risk overlays.",
              },
              {
                step: "03",
                icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
                title: "Act on Recommendations",
                desc: "Receive AI-generated actions — which suppliers to audit, which risks to escalate, and where to diversify. Make decisions with confidence.",
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 100} style={{ background: BG2 }}>
                <div className="lp-how-card" style={{ padding: "clamp(28px, 4vw, 48px) clamp(20px, 4vw, 40px)", height: "100%" }}>
                  <div style={{
                    fontFamily: F.serif, fontSize: "clamp(64px, 8vw, 96px)", fontStyle: "italic",
                    color: "rgba(255,255,255,0.04)", lineHeight: 1, marginBottom: -12,
                    userSelect: "none",
                  }}>
                    {s.step}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>{s.icon}</div>
                  <h3 style={{ fontFamily: F.sans, fontSize: "clamp(15px, 1.8vw, 18px)", fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em" }}>
                    {s.title}
                  </h3>
                  <p style={{ fontFamily: F.sans, fontSize: "clamp(13px, 1.3vw, 14px)", lineHeight: 1.7, color: "rgba(255,255,255,0.4)" }}>
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            5. FEATURES
        ═══════════════════════════════════════════════ */}
        <section id="features" className="lp-section-pad" style={{ background: BG }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
              <div style={{ width: 28, height: 1, background: LIME }} />
              <span style={{ fontFamily: F.mono, fontSize: 11, color: LIME, letterSpacing: "0.12em" }}>PLATFORM</span>
            </div>
            <h2 style={{ fontFamily: F.serif, fontSize: "clamp(32px, 4vw, 52px)", fontStyle: "italic", letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0, marginBottom: 48 }}>
              Everything you need to<br />govern your supply chain.
            </h2>
          </Reveal>

          <div className="lp-features-grid">
            {/* Big card */}
            <Reveal className="lp-features-big">
              <div className="lp-feature-card" style={{
                height: "100%", padding: "clamp(28px, 4vw, 48px) clamp(20px, 4vw, 44px)",
                borderRadius: 4, background: BG2,
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ marginBottom: 36, position: "relative", width: 110, height: 110 }}>
                  <svg viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={LIME} strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - 0.942)}
                      style={{ transition: "stroke-dashoffset 1.5s ease" }}
                    />
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: F.mono, fontSize: 24, fontWeight: 300, letterSpacing: "-0.03em", color: LIME }}>94.2</span>
                    <span style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.10em", marginTop: 2 }}>ESG SCORE</span>
                  </div>
                </div>

                <span style={{ fontFamily: F.mono, fontSize: 10, color: LIME, letterSpacing: "0.12em", marginBottom: 12 }}>CORE INTELLIGENCE</span>
                <h3 style={{ fontFamily: F.serif, fontSize: "clamp(24px, 2.5vw, 32px)", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 16 }}>
                  Risk Intelligence<br /><span style={{ fontStyle: "italic" }}>in Real Time</span>
                </h3>
                <p style={{ fontFamily: F.sans, fontSize: "clamp(13px, 1.3vw, 14px)", lineHeight: 1.7, color: "rgba(255,255,255,0.4)", marginBottom: 32, flex: 1 }}>
                  Live ESG scoring across 12,000+ suppliers. Geo-risk overlays show political instability, environmental exposure and labour violations — updated continuously from 400+ data sources.
                </p>
                <Link to="/dashboard" className="lp-cta-outline" style={{ alignSelf: "flex-start" }}>
                  Explore Dashboard →
                </Link>
              </div>
            </Reveal>

            {/* 3 smaller cards */}
            {[
              {
                tag: "ANALYTICS",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>,
                title: "Deep ESG Analytics",
                desc: "Drill into E, S and G sub-scores. Benchmark suppliers against industry peers.",
              },
              {
                tag: "AI RECOMMENDATIONS",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
                title: "AI-Driven Actions",
                desc: "Know which supplier to audit next, which risk to escalate, and where to diversify.",
              },
              {
                tag: "SCENARIOS",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14"/></svg>,
                title: "Scenario Simulation",
                desc: "Model disruptions — tariffs, conflicts, climate events — and see how your chain score changes.",
              },
            ].map((f, i) => (
              <Reveal key={f.tag} delay={i * 80}>
                <div className="lp-feature-card" style={{ padding: "clamp(20px, 3vw, 32px) clamp(16px, 3vw, 36px)", borderRadius: 4, background: BG2 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 9, color: LIME, letterSpacing: "0.12em" }}>{f.tag}</span>
                  <div style={{ color: "rgba(255,255,255,0.35)", margin: "14px 0 10px" }}>{f.icon}</div>
                  <h3 style={{ fontFamily: F.sans, fontSize: "clamp(14px, 1.5vw, 16px)", fontWeight: 700, marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</h3>
                  <p style={{ fontFamily: F.sans, fontSize: "clamp(12px, 1.2vw, 13px)", lineHeight: 1.65, color: "rgba(255,255,255,0.38)" }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            6. NUMBERS
        ═══════════════════════════════════════════════ */}
        <section id="numbers" className="lp-section-pad" style={{ background: BG2 }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 56 }}>
              <div style={{ width: 28, height: 1, background: LIME }} />
              <span style={{ fontFamily: F.mono, fontSize: 11, color: LIME, letterSpacing: "0.12em" }}>BY THE NUMBERS</span>
              <div style={{ width: 28, height: 1, background: LIME }} />
            </div>
          </Reveal>

          <div ref={numbersRef} className="lp-numbers-grid">
            {[
              { target: 340, suffix: "+", label: "Enterprise Clients" },
              { prefix: "", target: 99, suffix: ".7%", label: "Uptime" },
              { prefix: "$", target: 2, suffix: ".4B", label: "Supply Value Monitored" },
              { target: 47, suffix: "", label: "Countries Covered" },
            ].map((n, i) => (
              <div
                key={n.label}
                className="lp-number-cell"
                style={{
                  textAlign: "center",
                  opacity: numbersVisible ? 1 : 0,
                  transform: numbersVisible ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 0.8s ease ${i * 100}ms, transform 0.8s ease ${i * 100}ms`,
                }}
              >
                <div style={{
                  fontFamily: F.serif, fontStyle: "italic",
                  fontSize: "clamp(40px, 5vw, 72px)", lineHeight: 1,
                  letterSpacing: "-0.03em", color: "#F5F5F0",
                }}>
                  {n.prefix || ""}<StatNum target={n.target} suffix="" visible={numbersVisible} />{n.suffix}
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.10em", marginTop: 12 }}>
                  {n.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            7. TESTIMONIAL
        ═══════════════════════════════════════════════ */}
        <section className="lp-section-pad" style={{ background: BG }}>
          <div style={{ maxWidth: 840, margin: "0 auto" }}>
            <Reveal>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 44 }}>
                <div style={{ width: 28, height: 1, background: LIME }} />
                <span style={{ fontFamily: F.mono, fontSize: 11, color: LIME, letterSpacing: "0.12em" }}>CLIENT VOICE</span>
              </div>

              <blockquote style={{
                fontFamily: F.serif, fontStyle: "italic",
                fontSize: "clamp(20px, 3vw, 34px)", lineHeight: 1.38,
                letterSpacing: "-0.01em", color: "#F5F5F0",
                margin: 0, marginBottom: 44,
              }}>
                "OptiSupply didn't just give us visibility — it gave us the confidence to make supply chain decisions that used to require a team of analysts. The ESG scoring alone has transformed our procurement process."
              </blockquote>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${LIME}40, rgba(255,255,255,0.1))`,
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: F.sans, fontWeight: 700, fontSize: 16, color: LIME,
                  flexShrink: 0,
                }}>
                  M
                </div>
                <div>
                  <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 14, color: "#F5F5F0" }}>
                    Marcus Heidler
                  </div>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", marginTop: 2 }}>
                    CPO — Helvetia Industries AG
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            8. CTA SPLIT
        ═══════════════════════════════════════════════ */}
        <div className="lp-cta-split">
          <Reveal className="lp-cta-dark">
            <span style={{ fontFamily: F.mono, fontSize: 10, color: LIME, letterSpacing: "0.12em", display: "block", marginBottom: 18 }}>
              GET STARTED TODAY
            </span>
            <h2 style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0, marginBottom: 16 }}>
              Your supply chain<br />deserves better data.
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: "clamp(13px, 1.3vw, 14px)", color: "rgba(255,255,255,0.4)", lineHeight: 1.65, maxWidth: 380 }}>
              Join 340+ enterprises using OptiSupply to build more ethical, resilient and transparent supply chains.
            </p>
          </Reveal>

          <div className="lp-cta-lime">
            <h3 style={{ fontFamily: F.serif, fontSize: "clamp(20px, 2.5vw, 30px)", letterSpacing: "-0.02em", color: "#080808", marginBottom: 8 }}>
              Request early access.
            </h3>
            <p style={{ fontFamily: F.sans, fontSize: 13, color: "rgba(0,0,0,0.55)", marginBottom: 24 }}>
              No credit card. Setup in under 5 minutes.
            </p>
            <form onSubmit={handleGetStarted} style={{ display: "flex", gap: 0, flexWrap: "wrap" }} noValidate>
              <input
                type="email"
                required
                aria-required="true"
                aria-invalid={!!emailError}
                placeholder="your@company.com"
                value={emailVal}
                onChange={(e) => { setEmailVal(e.target.value); setEmailError(""); }}
                style={{
                  flex: 1, minWidth: 180,
                  height: 48, padding: "0 16px",
                  border: "1.5px solid rgba(0,0,0,0.22)",
                  borderRight: "none",
                  borderRadius: "2px 0 0 2px",
                  background: "rgba(0,0,0,0.06)",
                  fontFamily: F.sans, fontSize: 13, color: "#080808",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  height: 48, padding: "0 22px",
                  background: "#080808", color: "#F5F5F0",
                  border: "none", borderRadius: "0 2px 2px 0",
                  fontFamily: F.sans, fontSize: 13, fontWeight: 700,
                  letterSpacing: "0.04em", cursor: "pointer",
                  transition: "opacity 0.2s", whiteSpace: "nowrap",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Request Access
              </button>
              <div style={{ width: "100%", marginTop: 8 }}>
                {emailError && (
                  <div role="alert" style={{ color: "#E84545", fontFamily: F.mono, fontSize: 12 }}>{emailError}</div>
                )}
                {emailSubmitted && (
                  <div role="status" style={{ color: "#083808", background: "#C8F05A", padding: "8px 10px", borderRadius: 4, fontFamily: F.sans, fontSize: 13, marginTop: 4 }}>
                    Thanks — we&apos;ll be in touch soon.
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            9. FOOTER
        ═══════════════════════════════════════════════ */}
        <footer style={{ background: BG, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="lp-footer-inner">
            <span style={{ fontFamily: F.serif, fontSize: 18, letterSpacing: "-0.02em", color: "#F5F5F0" }}>
              OptiSupply
            </span>
            <div className="lp-footer-links">
              <Link to="/dashboard"
                style={{ fontFamily: F.sans, fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em", textDecoration: "none", transition: "color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                Dashboard
              </Link>
              <Link to="/suppliers"
                style={{ fontFamily: F.sans, fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em", textDecoration: "none", transition: "color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                Suppliers
              </Link>
              <Link to="/recommendations"
                style={{ fontFamily: F.sans, fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em", textDecoration: "none", transition: "color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                Recommendations
              </Link>
              <Link to="/about"
                style={{ fontFamily: F.sans, fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em", textDecoration: "none", transition: "color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                About
              </Link>
            </div>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>
              © 2026 OptiSupply
            </span>
          </div>
        </footer>

      </div>
    </>
  );
};

export default HomePage;
