import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Globe,
  Users,
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
  LogOut,
  Activity,
  Info,
  Beaker as BeakerIcon,
  TestTube,
  Command,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// Interface for Nav Item
interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const ORB_SIZE = 56; // Size of the central orb button
const MENU_RADIUS = 120; // Radius of the expanded menu items
const ITEM_SIZE = 48; // Size of individual menu item buttons

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = () => {
    console.log("Open Search"); // Placeholder
    setIsMobileMenuOpen(false);
  };

  const handleSettings = () => {
    console.log("Open Settings"); // Placeholder
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    console.log("Logout"); // Placeholder
    setIsMobileMenuOpen(false);
  };

  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: <BarChart3 size={20} /> },
    { name: "Suppliers", path: "/suppliers", icon: <List size={20} /> },
    {
      name: "Recommendations",
      path: "/recommendations",
      icon: <TrendingUp size={20} />,
    },
    { name: "Graph", path: "/supply-chain-graph", icon: <Globe size={20} /> },
    { name: "Geo Risk", path: "/geo-risk-mapping", icon: <Map size={20} /> },
    { name: "Scenarios", path: "/scenarios", icon: <TestTube size={20} /> },
    { name: "Methodology", path: "/methodology", icon: <BeakerIcon size={20} /> },
    { name: "About", path: "/about", icon: <Info size={20} /> },
  ];

  const itemVariants = {
    closed: {
      x: 0,
      y: 0,
      scale: 0,
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" },
    },
    open: (i: number) => {
      const angle = (i * (360 / navItems.length) - 90) * (Math.PI / 180); // Adjust starting angle if needed
      return {
        x: Math.cos(angle) * MENU_RADIUS,
        y: Math.sin(angle) * MENU_RADIUS,
        scale: 1,
        opacity: 1,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 15,
          delay: i * 0.03,
        },
      };
    },
  };

  const orbVariants = {
    closed: { scale: 1, rotate: 0 },
    open: { scale: 0.9, rotate: 45 },
  };

  const menuBackgroundVariants = {
    closed: { scale: 0, opacity: 0 },
    open: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3, ease: "circOut" },
    },
  };

  const isActivePath = (path: string) =>
    location.pathname === path ||
    (path === "/suppliers" &&
      (location.pathname.startsWith("/suppliers/") ||
        location.pathname.startsWith("/supplier-details/") ||
        location.pathname.startsWith("/supplier-scorecard/")));

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? "bg-[#F5F5F0]/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl"
          : "bg-[#F5F5F0]/60 dark:bg-[#0A0A0A]/60 backdrop-blur-md"
      }`}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 lg:gap-6">
            <Link
              to="/dashboard"
              className="flex-shrink-0 flex items-center gap-2.5 group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div
                className="relative h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                style={{ background: "#C8F05A", boxShadow: "0 4px 14px -4px rgba(200,240,90,0.5)" }}
              >
                <Activity className="h-5 w-5" style={{ color: "#0A0A0A" }} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-[16px] tracking-tight" style={{ color: "inherit", letterSpacing: "-0.02em" }}>
                  Opti<span style={{ color: "#C8F05A" }}>Supply</span>
                </span>
                <span className="hidden lg:block text-[10px] font-medium uppercase mt-0.5" style={{ letterSpacing: "0.12em", color: "#808080" }}>
                  ESG Intelligence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links - sliding active indicator */}
            <div className="hidden md:flex items-center gap-0.5 p-1 rounded-lg" style={{ border: "1px solid rgba(128,128,128,0.10)", background: "rgba(128,128,128,0.04)" }}>
              {navItems.map((item) => {
                const active = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                      active
                        ? ""
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    }`}
                    style={active ? { color: "#0A0A0A" } : {}}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-md"
                        style={{ background: "#C8F05A", boxShadow: "0 2px 8px -2px rgba(200,240,90,0.4)" }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span className={active ? "opacity-100" : "opacity-70"}>
                        {item.icon}
                      </span>
                      <span className="hidden lg:inline">{item.name}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Search Button/Input */}
            <motion.div
              className={`relative flex items-center transition-all duration-300 ease-out ${
                isSearchOpen ? "w-56 lg:w-72" : "w-44 lg:w-52"
              }`}
              layout
            >
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400 dark:text-slate-500 z-10" />
              <input
                type="search"
                placeholder="Search suppliers, scores…"
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setIsSearchOpen(false)}
                className="h-9 w-full pl-9 pr-14 text-sm transition-all focus:outline-none"
                style={{
                  borderRadius: "6px",
                  background: "rgba(128,128,128,0.06)",
                  border: "1px solid rgba(128,128,128,0.12)",
                  color: "inherit",
                }}
              />
              <kbd className="absolute right-2 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium font-mono text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 shadow-sm">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </motion.div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

            {/* Action cluster */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleDarkMode}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
                aria-label="Toggle dark mode"
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} />
                )}
              </button>

              <Link
                to="/settings"
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
                title="Settings"
                aria-label="Open settings"
              >
                <Settings size={18} />
              </Link>

              <Link
                to="/suppliers/add"
                className="ml-1 inline-flex items-center gap-1.5 px-3 h-9 text-xs font-semibold transition-all hover:opacity-90"
                style={{
                  borderRadius: "6px",
                  background: "#C8F05A",
                  color: "#0A0A0A",
                  boxShadow: "0 2px 10px -2px rgba(200,240,90,0.4)",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                New Supplier
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lime-400"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 text-base font-medium transition-colors duration-200 ${
                    isActivePath(item.path)
                      ? ""
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5"
                  }`}
                  style={isActivePath(item.path) ? {
                    background: "rgba(200,240,90,0.12)",
                    color: "#C8F05A",
                    borderRadius: "6px",
                  } : { borderRadius: "6px" }}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 pb-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSearch}
                  className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                >
                  <Search className="mr-3 h-5 w-5" /> Search
                </button>
                <button
                  onClick={() => {
                    toggleDarkMode();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <Sun className="mr-3 h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="mr-3 h-5 w-5 text-gray-600" />
                  )}
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </button>
                <Link
                  to="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                >
                  <Settings className="mr-3 h-5 w-5" /> Settings
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
