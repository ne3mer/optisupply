import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Globe,
  Menu,
  X,
  Search,
  Settings,
  Sun,
  Moon,
  Plus,
  List,
  Map,
  TrendingUp,
  Activity,
  Info,
  FlaskConical,
  TestTube,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close more menu on route change
  useEffect(() => {
    setIsMoreOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Primary nav — always visible on desktop
  const primaryNav: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: <BarChart3 size={16} /> },
    { name: "Suppliers", path: "/suppliers", icon: <List size={16} /> },
    { name: "Recomend", path: "/recommendations", icon: <TrendingUp size={16} /> },
    { name: "Graph", path: "/supply-chain-graph", icon: <Globe size={16} /> },
    { name: "Geo Risk", path: "/geo-risk-mapping", icon: <Map size={16} /> },
  ];

  // Secondary nav — hidden behind "More" dropdown on desktop
  const secondaryNav: NavItem[] = [
    { name: "Scenarios", path: "/scenarios", icon: <TestTube size={16} /> },
    { name: "Methodology", path: "/methodology", icon: <FlaskConical size={16} /> },
    { name: "About", path: "/about", icon: <Info size={16} /> },
  ];

  const allNav = [...primaryNav, ...secondaryNav];

  const isActivePath = (path: string) =>
    location.pathname === path ||
    (path === "/suppliers" &&
      (location.pathname.startsWith("/suppliers/") ||
        location.pathname.startsWith("/supplier-details/") ||
        location.pathname.startsWith("/supplier-scorecard/")));

  const anySecondaryActive = secondaryNav.some((item) => isActivePath(item.path));

  const NavLink = ({ item, compact = false }: { item: NavItem; compact?: boolean }) => {
    const active = isActivePath(item.path);
    return (
      <Link
        to={item.path}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors rounded-md"
        style={
          active
            ? { color: "#0A0A0A" }
            : { color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)" }
        }
      >
        {active && (
          <motion.span
            layoutId="nav-active-pill"
            className="absolute inset-0 rounded-md"
            style={{
              background: "#C8F05A",
              boxShadow: "0 2px 8px -2px rgba(200,240,90,0.45)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <span className="shrink-0">{item.icon}</span>
          {!compact && <span className="hidden lg:inline whitespace-nowrap">{item.name}</span>}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: isScrolled || isMobileMenuOpen
          ? darkMode ? "rgba(10,10,10,0.88)" : "rgba(245,245,240,0.88)"
          : darkMode ? "rgba(10,10,10,0.70)" : "rgba(245,245,240,0.70)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: darkMode
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-5 lg:px-8">
        <div className="flex items-center h-14 gap-2 sm:gap-3">

          {/* ── Logo ──────────────────────────────────────────── */}
          <Link
            to="/dashboard"
            className="flex-shrink-0 flex items-center gap-2 group mr-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="h-8 w-8 rounded-md flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{ background: "#C8F05A", boxShadow: "0 3px 12px -3px rgba(200,240,90,0.5)" }}
            >
              <Activity className="h-4 w-4" style={{ color: "#0A0A0A" }} strokeWidth={2.5} />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span
                className="text-[15px] font-semibold"
                style={{
                  letterSpacing: "-0.02em",
                  color: darkMode ? "#F5F5F0" : "#0A0A0A",
                }}
              >
                Opti<span style={{ color: "#C8F05A" }}>Supply</span>
              </span>
              <span
                className="hidden xl:block text-[9px] font-medium uppercase mt-0.5"
                style={{ letterSpacing: "0.12em", color: "#808080" }}
              >
                ESG Intelligence
              </span>
            </div>
          </Link>

          {/* ── Primary Nav ──────────────────────────────────── */}
          <div
            className="hidden md:flex items-center gap-0.5 p-0.5 rounded-md flex-shrink-0"
            style={{
              border: "1px solid rgba(128,128,128,0.10)",
              background: "rgba(128,128,128,0.04)",
            }}
          >
            {primaryNav.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setIsMoreOpen((v) => !v)}
                className="flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors"
                style={{
                  color: anySecondaryActive
                    ? "#0A0A0A"
                    : darkMode
                    ? "rgba(255,255,255,0.55)"
                    : "rgba(0,0,0,0.55)",
                  background: anySecondaryActive ? "#C8F05A" : undefined,
                }}
              >
                <ChevronDown size={13} className={`transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
                <span className="hidden lg:inline">More</span>
              </button>

              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-[calc(100%+6px)] min-w-[140px] py-1 rounded-lg shadow-xl z-50"
                    style={{
                      background: darkMode ? "#111111" : "#FFFFFF",
                      border: "1px solid rgba(128,128,128,0.12)",
                    }}
                  >
                    {secondaryNav.map((item) => {
                      const active = isActivePath(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                          style={{
                            color: active
                              ? "#C8F05A"
                              : darkMode
                              ? "rgba(255,255,255,0.7)"
                              : "rgba(0,0,0,0.7)",
                            background: active ? "rgba(200,240,90,0.08)" : undefined,
                          }}
                        >
                          <span style={{ color: active ? "#C8F05A" : "#808080" }}>{item.icon}</span>
                          {item.name}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Spacer ───────────────────────────────────────── */}
          <div className="flex-1" />

          {/* ── Search ───────────────────────────────────────── */}
          <div className="hidden md:flex items-center relative">
            <Search
              className="absolute left-2.5 h-3.5 w-3.5 pointer-events-none z-10"
              style={{ color: "#808080" }}
            />
            <input
              type="search"
              placeholder="Search…"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="h-8 pl-8 pr-3 text-xs transition-all focus:outline-none"
              style={{
                borderRadius: "6px",
                width: isSearchFocused ? "200px" : "130px",
                background: "rgba(128,128,128,0.07)",
                border: isSearchFocused
                  ? "1px solid rgba(200,240,90,0.4)"
                  : "1px solid rgba(128,128,128,0.12)",
                color: "inherit",
                transition: "width 200ms ease, border-color 150ms ease",
              }}
            />
          </div>

          {/* ── Actions ──────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            <div
              className="h-5 w-px mx-0.5"
              style={{ background: "rgba(128,128,128,0.15)" }}
            />
            <button
              onClick={toggleDarkMode}
              className="h-8 w-8 flex items-center justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun size={15} style={{ color: "#FBBF24" }} />
              ) : (
                <Moon size={15} style={{ color: "#555" }} />
              )}
            </button>

            <Link
              to="/settings"
              className="h-8 w-8 flex items-center justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              title="Settings"
            >
              <Settings size={15} style={{ color: "#808080" }} />
            </Link>

            <Link
              to="/suppliers/add"
              className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold ml-1 transition-opacity hover:opacity-88"
              style={{
                borderRadius: "6px",
                background: "#C8F05A",
                color: "#0A0A0A",
                boxShadow: "0 2px 8px -2px rgba(200,240,90,0.4)",
                letterSpacing: "-0.01em",
              }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span className="hidden lg:inline">New Supplier</span>
              <span className="lg:hidden">New</span>
            </Link>
          </div>

          {/* ── Mobile hamburger ─────────────────────────────── */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggleDarkMode}
              className="h-8 w-8 flex items-center justify-center rounded-md"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun size={15} style={{ color: "#FBBF24" }} />
              ) : (
                <Moon size={15} style={{ color: "#555" }} />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-8 w-8 flex items-center justify-center rounded-md"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X size={18} style={{ color: darkMode ? "#F5F5F0" : "#0A0A0A" }} />
              ) : (
                <Menu size={18} style={{ color: darkMode ? "#F5F5F0" : "#0A0A0A" }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
            style={{
              background: darkMode ? "rgba(10,10,10,0.97)" : "rgba(245,245,240,0.97)",
              borderTop: "1px solid rgba(128,128,128,0.10)",
            }}
          >
            <div className="px-4 py-3 space-y-0.5">
              {allNav.map((item) => {
                const active = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                    style={{
                      background: active ? "rgba(200,240,90,0.10)" : "transparent",
                      color: active
                        ? "#C8F05A"
                        : darkMode
                        ? "rgba(255,255,255,0.65)"
                        : "rgba(0,0,0,0.65)",
                    }}
                  >
                    <span style={{ color: active ? "#C8F05A" : "#808080" }}>{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}

              <div
                className="pt-3 mt-2 flex flex-col gap-0.5"
                style={{ borderTop: "1px solid rgba(128,128,128,0.10)" }}
              >
                <Link
                  to="/suppliers/add"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold"
                  style={{
                    background: "rgba(200,240,90,0.10)",
                    color: "#C8F05A",
                  }}
                >
                  <Plus size={16} /> New Supplier
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium"
                  style={{ color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)" }}
                >
                  <Settings size={16} /> Settings
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
