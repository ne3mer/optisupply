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
  LogOut, // Assuming a logout function exists
  Activity, // Logo icon
  Info, // <-- Import the Info icon
  Beaker as BeakerIcon,
  TestTube, // Scenarios icon
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
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to="/dashboard"
              className="flex-shrink-0 flex items-center space-x-2 group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="h-8 w-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-xl tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                OptiSupply
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <motion.div key={item.path} whileHover={{ y: -2 }}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out group ${
                    isActivePath(item.path)
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-800/60 dark:text-emerald-300"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span
                    className={`mr-1.5 opacity-80 group-hover:opacity-100 transition-opacity ${
                      isActivePath(item.path)
                        ? "text-emerald-600 dark:text-emerald-400 opacity-100"
                        : ""
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Right Side Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-1 md:space-x-2">
            {/* Search Button/Input Area */}
            <motion.div
              className={`relative flex items-center transition-all duration-300 ease-in-out ${
                isSearchOpen ? "w-48 md:w-64" : "w-10"
              }`}
              layout
            >
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 focus:outline-none z-10"
                whileTap={{ scale: 0.9 }}
              >
                <Search className="h-5 w-5" />
              </motion.button>
              <input
                type="search"
                placeholder="Search..."
                className={`absolute inset-y-0 left-0 h-full pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-full leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 ease-in-out ${
                  isSearchOpen
                    ? "w-full opacity-100 pointer-events-auto"
                    : "w-0 opacity-0 pointer-events-none"
                }`}
                onBlur={() => setIsSearchOpen(false)}
              />
            </motion.div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun size={20} className="text-yellow-500" />
              ) : (
                <Moon size={20} className="text-gray-600" />
              )}
            </button>

            {/* Settings Button - Changed to Link */}
            <Link
              to="/settings" // Navigate to settings page
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 focus:outline-none"
              title="Settings"
            >
              <motion.div whileTap={{ scale: 0.9 }}>
                {" "}
                {/* Keep tap animation */}
                <Settings size={20} />
              </motion.div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
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
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActivePath(item.path)
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                  }`}
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
