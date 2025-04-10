import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ChartBarIcon,
  LightBulbIcon,
  CubeTransparentIcon,
  ScaleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";

const HomePage = () => {
  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Navigation Bar */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-2xl font-bold">
            EthicSupply
          </span>
        </div>
        <div className="hidden md:flex space-x-8 text-gray-300">
          <a
            href="#features"
            className="hover:text-emerald-400 transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-emerald-400 transition-colors"
          >
            How It Works
          </a>
          <a href="#about" className="hover:text-emerald-400 transition-colors">
            About
          </a>
        </div>
        <div>
          <Link
            to="/dashboard"
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-2 rounded-full hover:shadow-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Transform Your </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Supply Chain Ethics
              </span>
            </h1>
            <p className="text-gray-300 text-xl mb-8">
              EthicSupply is an AI-powered platform for ethical supply chain
              management, helping businesses make sustainable decisions with
              comprehensive analytics and actionable insights.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/dashboard"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-3 rounded-md flex items-center justify-center hover:shadow-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
              >
                Get Started <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <a
                href="#how-it-works"
                className="bg-transparent border border-cyan-500 text-cyan-400 px-8 py-3 rounded-md flex items-center justify-center hover:bg-cyan-900/20 transition-all"
              >
                Learn More
              </a>
            </div>
          </motion.div>
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full h-[400px] bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/30">
              <div className="absolute inset-0 bg-[url('/images/world-map-dots.svg')] bg-no-repeat bg-center opacity-20"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/40 to-cyan-600/40 rounded-2xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 z-10">
                <img
                  src="/images/dashboard-illustration.svg"
                  alt="EthicSupply Dashboard Preview"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full opacity-60 blur-2xl"></div>
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full opacity-60 blur-2xl"></div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-900/60 backdrop-blur-sm py-16 border-t border-b border-cyan-900/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                85%
              </div>
              <p className="text-gray-400">Improved compliance accuracy</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                62%
              </div>
              <p className="text-gray-400">Risk reduction</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                40%
              </div>
              <p className="text-gray-400">Faster decision making</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                3.5x
              </div>
              <p className="text-gray-400">ROI for sustainable practices</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Powerful Features
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our comprehensive toolset helps supply chain decision makers
              navigate the complexities of ethical sourcing and sustainable
              operations.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<ShieldCheckIcon className="w-7 h-7" />}
            title="Ethical Scoring System"
            description="Automated assessment of suppliers based on environmental, social, and governance metrics with detailed scorecards."
            delay={0.1}
          />
          <FeatureCard
            icon={<GlobeAltIcon className="w-7 h-7" />}
            title="Global Risk Mapping"
            description="Interactive visualizations of geopolitical, environmental, and social risks across your entire supply chain."
            delay={0.2}
          />
          <FeatureCard
            icon={<ChartBarIcon className="w-7 h-7" />}
            title="Performance Analytics"
            description="Comprehensive dashboards for tracking supplier performance over time with industry benchmarking."
            delay={0.3}
          />
          <FeatureCard
            icon={<LightBulbIcon className="w-7 h-7" />}
            title="AI-Powered Recommendations"
            description="Smart suggestions for ethical improvements tailored to each supplier's specific circumstances."
            delay={0.4}
          />
          <FeatureCard
            icon={<CubeTransparentIcon className="w-7 h-7" />}
            title="Supply Chain Visualization"
            description="3D network graphs that reveal connections, dependencies, and potential vulnerabilities in your supply network."
            delay={0.5}
          />
          <FeatureCard
            icon={<DocumentTextIcon className="w-7 h-7" />}
            title="ESG Reporting"
            description="Generate comprehensive reports for stakeholders, regulators, and sustainability certifications."
            delay={0.6}
          />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                How It Works
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                EthicSupply simplifies the complex process of ethical supply
                chain management through a systematic approach.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <WorkflowStep
              number="01"
              title="Data Collection & Integration"
              description="Seamlessly import supplier data from multiple sources or enter new information through our intuitive interface."
              icon={<ServerIcon className="w-7 h-7" />}
            />
            <WorkflowStep
              number="02"
              title="AI Analysis & Scoring"
              description="Our machine learning algorithms analyze the data to produce comprehensive ethical scores and risk assessments."
              icon={<ScaleIcon className="w-7 h-7" />}
            />
            <WorkflowStep
              number="03"
              title="Decision Support & Action"
              description="Review insights, receive tailored recommendations, and implement concrete actions to improve your supply chain ethics."
              icon={<UserGroupIcon className="w-7 h-7" />}
            />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-cyan-900/30"
          >
            <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              About The Project
            </h2>
            <p className="text-gray-300 mb-4">
              EthicSupply represents a breakthrough in supply chain management
              technology, combining advanced AI with ethical assessment
              frameworks to help businesses make more responsible sourcing
              decisions.
            </p>
            <p className="text-gray-300 mb-6">
              This project is the result of research conducted at Budapest
              Metropolitan University, focusing on the intersection of
              artificial intelligence and sustainable business practices.
            </p>
            <div className="border-t border-cyan-900/30 pt-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Created by:
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  NF
                </div>
                <div>
                  <p className="text-white font-medium">Nima Afshar</p>
                  <p className="text-gray-400 text-sm">
                    Budapest Metropolitan University
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              For Supply Chain Leaders
            </h2>
            <div className="space-y-4">
              <BenefitPoint title="Regulatory Compliance">
                Stay ahead of evolving ESG regulations with automated compliance
                checks and alerts.
              </BenefitPoint>
              <BenefitPoint title="Risk Mitigation">
                Identify and address ethical risks before they impact your
                business and reputation.
              </BenefitPoint>
              <BenefitPoint title="Competitive Advantage">
                Differentiate your brand through demonstrable ethical practices
                and transparency.
              </BenefitPoint>
              <BenefitPoint title="Operational Efficiency">
                Streamline supplier evaluation processes and focus resources on
                high-impact areas.
              </BenefitPoint>
              <BenefitPoint title="Stakeholder Trust">
                Build confidence with investors, customers, and partners through
                data-driven ethical commitments.
              </BenefitPoint>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 border-t border-b border-cyan-900/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Transform Your Supply Chain?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Join forward-thinking companies that are leveraging EthicSupply to
            build more sustainable, ethical, and resilient supply chains.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-md text-lg hover:shadow-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">EthicSupply</h3>
              <p className="text-gray-400 text-sm">
                AI-powered ethical supply chain management platform for modern
                businesses.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Features</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>Ethical Scoring</li>
                <li>Risk Mapping</li>
                <li>Analytics Dashboard</li>
                <li>AI Recommendations</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Resources</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Case Studies</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
              <p className="text-gray-400 text-sm">
                Budapest Metropolitan University
                <br />
                Nagy Lajos király útja 1-9
                <br />
                1148 Budapest, Hungary
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2023 EthicSupply. Budapest Metropolitan University. All rights
              reserved.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-cyan-900/30 hover:border-cyan-500/50 transition-all group"
    >
      <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 p-3 rounded-lg inline-block mb-4 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-emerald-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
};

// Workflow Step Component
const WorkflowStep = ({ number, title, description, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="bg-slate-900 p-8 rounded-xl border border-cyan-900/30 relative"
    >
      <div className="absolute -top-5 -left-5 w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
        {number}
      </div>
      <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-4 rounded-full inline-block mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
};

// Benefit Point Component
const BenefitPoint = ({ title, children }) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-900/20">
      <h3 className="flex items-center text-white font-medium mb-2">
        <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full mr-2 flex-shrink-0"></div>
        {title}
      </h3>
      <p className="text-gray-400 pl-7">{children}</p>
    </div>
  );
};

export default HomePage;
