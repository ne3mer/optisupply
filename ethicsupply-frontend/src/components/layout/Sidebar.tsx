import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Network,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Supply Chain", path: "/supply-chain", icon: Network },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const bottomItems = [
    { name: "Help", path: "/help", icon: HelpCircle },
    { name: "Logout", path: "/logout", icon: LogOut },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-neutral-200 overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-primary-600"
                }`}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="mr-3"
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-primary-600" : "text-neutral-400"
                    }`}
                  />
                </motion.div>
                <span className="text-sm font-medium">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-4 w-1.5 h-6 bg-primary-500 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-4 py-4 border-t border-neutral-200">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-primary-600"
                }`}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="mr-3"
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-primary-600" : "text-neutral-400"
                    }`}
                  />
                </motion.div>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
