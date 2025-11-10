import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  InformationCircleIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  ScaleIcon,
  LightBulbIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  BeakerIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  ServerIcon,
  CpuChipIcon,
  DatabaseIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useThemeColors } from "../theme/useThemeColors";

const About: React.FC = () => {
  const colors = useThemeColors() as any;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const featureCards = [
    {
      icon: ChartBarIcon,
      title: "ESG Scoring System",
      description: "Comprehensive Environmental, Social, and Governance scoring with industry-specific normalization and risk-adjusted penalties.",
      color: "#10b981",
    },
    {
      icon: BeakerIcon,
      title: "Scenario Analysis",
      description: "Four analytical scenarios (S1-S4) test utility, sensitivity, missingness, and fairness of supplier rankings.",
      color: "#3b82f6",
    },
    {
      icon: ShieldCheckIcon,
      title: "Risk Assessment",
      description: "Multi-dimensional risk penalty system considering geopolitical, climate, and labor risks with configurable thresholds.",
      color: "#8b5cf6",
    },
    {
      icon: ScaleIcon,
      title: "Fair Comparison",
      description: "Industry-specific normalization bands ensure fair comparison across different sectors and business models.",
      color: "#f59e0b",
    },
  ];

  const techStack = [
    { name: "React + TypeScript", category: "Frontend" },
    { name: "Node.js + Express", category: "Backend" },
    { name: "MongoDB + Mongoose", category: "Database" },
    { name: "Framer Motion", category: "UI/UX" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "ESG Scoring Engine", category: "Core Logic" },
  ];

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        backgroundImage:
          "radial-gradient(circle at 10% 20%, rgba(0, 240, 255, 0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(77, 91, 255, 0.05) 0%, transparent 40%)",
      }}
    >
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        {/* Hero Section */}
        <motion.div
          variants={cardVariants}
          className="relative overflow-hidden rounded-xl border p-6 md:p-8 mb-8"
          style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
        >
          <motion.div
            className="absolute -inset-24 blur-3xl opacity-20"
            style={{ background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})` }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <LightBulbIcon className="w-8 h-8" style={{ color: colors.primary }} />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About OptiSupply</h1>
            </div>
            <p className="text-lg md:text-xl mt-2 mb-4" style={{ color: colors.textMuted }}>
              An AI-powered ethical supply chain management platform that balances cost efficiency with 
              environmental, social, and governance criteria to enable responsible supplier selection.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs px-3 py-1 rounded-full border" style={{ color: colors.textMuted, borderColor: colors.accent + "40" }}>
                MBA Thesis Project
              </span>
              <span className="text-xs px-3 py-1 rounded-full border" style={{ color: colors.textMuted, borderColor: colors.accent + "40" }}>
                2025
              </span>
              <span className="text-xs px-3 py-1 rounded-full border" style={{ color: colors.textMuted, borderColor: colors.accent + "40" }}>
                Budapest Metropolitan University
              </span>
            </div>
          </div>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border p-6 md:p-8 mb-8"
          style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center">
            <InformationCircleIcon className="w-7 h-7 mr-3" style={{ color: colors.primary }} />
            Our Mission
          </h2>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: colors.textMuted }}>
            At OptiSupply, we believe ethical and sustainable decisions should be the foundation of every supply chain. 
            Our mission is to empower companies with an AI-powered decision support tool that goes beyond cost to prioritize 
            environmental impact, labor practices, and ethical sourcing. We provide transparent, data-driven insights that 
            help organizations make responsible choices without sacrificing efficiency.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {featureCards.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="rounded-xl border p-5 md:p-6 relative overflow-hidden"
              style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
            >
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${feature.color}, transparent)` }}
              />
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div
                    className="p-2 rounded-lg mr-3"
                    style={{ backgroundColor: feature.color + "20" }}
                  >
                    <feature.icon className="h-6 w-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm md:text-base" style={{ color: colors.textMuted }}>
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border p-6 md:p-8 mb-8"
          style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center">
            <RocketLaunchIcon className="w-7 h-7 mr-3" style={{ color: colors.primary }} />
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-lg">1. Data Input</h3>
              <p className="text-sm md:text-base mb-4" style={{ color: colors.textMuted }}>
                Companies input supplier data including cost, environmental metrics (emissions, water, waste, renewable energy), 
                social indicators (safety, training, wages, diversity), and governance factors (board composition, transparency, compliance).
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">2. Scoring & Normalization</h3>
              <p className="text-sm md:text-base mb-4" style={{ color: colors.textMuted }}>
                Our AI engine normalizes metrics using industry-specific bands, computes Environmental (40%), Social (30%), 
                and Governance (30%) pillar scores, then applies risk-adjusted penalties based on geopolitical, climate, and labor risks.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">3. Ranking & Analysis</h3>
              <p className="text-sm md:text-base mb-4" style={{ color: colors.textMuted }}>
                Suppliers are ranked by Final Score (Composite - Risk Penalty). Four scenario analyses (S1-S4) test utility, 
                sensitivity, missingness handling, and fairness across industries.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">4. Decision Support</h3>
              <p className="text-sm md:text-base mb-4" style={{ color: colors.textMuted }}>
                Users receive transparent, data-driven recommendations with detailed breakdowns, scenario comparisons, 
                and visualizations that support responsible sourcing decisions.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Technology Stack */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border p-6 md:p-8 mb-8"
          style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center">
            <CodeBracketIcon className="w-7 h-7 mr-3" style={{ color: colors.primary }} />
            Technology Stack
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {techStack.map((tech, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border text-center"
                style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}
              >
                <p className="font-semibold text-sm mb-1">{tech.name}</p>
                <p className="text-xs" style={{ color: colors.textMuted }}>{tech.category}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
              <ServerIcon className="h-5 w-5 mb-2" style={{ color: colors.primary }} />
              <h4 className="font-semibold text-sm mb-1">Backend</h4>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                Node.js, Express, MongoDB, Mongoose ODM
              </p>
            </div>
            <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
              <CpuChipIcon className="h-5 w-5 mb-2" style={{ color: colors.primary }} />
              <h4 className="font-semibold text-sm mb-1">Frontend</h4>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                React, TypeScript, Tailwind CSS, Framer Motion
              </p>
            </div>
            <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.accent + "30" }}>
              <DatabaseIcon className="h-5 w-5 mb-2" style={{ color: colors.primary }} />
              <h4 className="font-semibold text-sm mb-1">Core Logic</h4>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                ESG Scoring Engine, Risk Penalty Calculator, Scenario Runner
              </p>
            </div>
          </div>
        </motion.div>

        {/* Academic Foundations */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border p-6 md:p-8 mb-8"
          style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center">
            <AcademicCapIcon className="w-7 h-7 mr-3" style={{ color: colors.primary }} />
            Academic Foundations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-lg">Institution</h3>
              <p className="text-base mb-4" style={{ color: colors.textMuted }}>
                <strong>Budapest Metropolitan University</strong>
                <br />
                MBA Program
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">Supervisor</h3>
              <p className="text-base mb-4" style={{ color: colors.textMuted }}>
                <strong>Dr. Alpár Vera Noémi</strong>
                <br />
                Thesis Supervisor
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">Year</h3>
              <p className="text-base mb-4" style={{ color: colors.textMuted }}>
                <strong>2025</strong>
                <br />
                Academic Year
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">Research Focus</h3>
              <p className="text-base mb-4" style={{ color: colors.textMuted }}>
                AI-driven ethical decision-making in supply chain management, 
                balancing cost efficiency with ESG criteria
              </p>
            </div>
          </div>
        </motion.div>

        {/* Developer Info */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border p-6 md:p-8 mb-8"
          style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center">
            <UserIcon className="w-7 h-7 mr-3" style={{ color: colors.primary }} />
            Created By
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Mohammad Afshar Far (Nima)</h3>
              <p className="text-base mb-2" style={{ color: colors.textMuted }}>
                MBA Candidate | Tech Enthusiast | AI Ethics Researcher
              </p>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Developer of OptiSupply, combining academic research with practical software engineering 
                to create tools that enable ethical decision-making in business operations.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Key Capabilities */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border p-6 md:p-8 mb-8"
          style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center">
            <GlobeAltIcon className="w-7 h-7 mr-3" style={{ color: colors.primary }} />
            Key Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="list-disc list-inside space-y-2" style={{ color: colors.textMuted }}>
              <li>Multi-dimensional ESG scoring (Environmental, Social, Governance)</li>
              <li>Industry-specific normalization for fair comparison</li>
              <li>Risk-adjusted scoring with configurable penalties</li>
              <li>Four scenario analyses (Utility, Sensitivity, Missingness, Fairness)</li>
            </ul>
            <ul className="list-disc list-inside space-y-2" style={{ color: colors.textMuted }}>
              <li>Transparent calculation traces and breakdowns</li>
              <li>Data completeness safeguards</li>
              <li>CSV export for all scenarios and rankings</li>
              <li>Real-time dashboard with visualizations</li>
            </ul>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border p-6 md:p-8"
          style={{ backgroundColor: colors.panel, borderColor: colors.accent + "40" }}
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center">
            <ChatBubbleLeftRightIcon className="w-7 h-7 mr-3" style={{ color: colors.primary }} />
            Explore & Learn More
          </h2>
          <p className="text-base mb-6" style={{ color: colors.textMuted }}>
            We're actively looking for companies, researchers, and changemakers to test or co-develop OptiSupply. 
            Let's build better supply chains—together.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-md border font-medium transition-opacity hover:opacity-90"
              style={{ color: colors.primary, borderColor: colors.primary + "40", backgroundColor: colors.background }}
            >
              View Dashboard
            </Link>
            <Link
              to="/scenarios"
              className="px-4 py-2 rounded-md border font-medium transition-opacity hover:opacity-90"
              style={{ color: colors.accent, borderColor: colors.accent + "40", backgroundColor: colors.background }}
            >
              Run Scenarios
            </Link>
            <Link
              to="/methodology"
              className="px-4 py-2 rounded-md border font-medium transition-opacity hover:opacity-90"
              style={{ color: colors.accent, borderColor: colors.accent + "40", backgroundColor: colors.background }}
            >
              Read Methodology
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default About;
