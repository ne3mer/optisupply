import React from "react";
import { motion } from "framer-motion";
import {
  InformationCircleIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  ScaleIcon,
  LightBulbIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

const OptiSupplyAboutPage: React.FC = () => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <motion.h1
          className="text-4xl font-bold text-center mb-4 text-white flex items-center justify-center"
          variants={cardVariants}
        >
          <LightBulbIcon className="w-10 h-10 mr-3 text-yellow-400" />
          About OptiSupply
        </motion.h1>

        <motion.div
          className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-xl p-8 mb-8"
          variants={cardVariants}
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-teal-400">
            <InformationCircleIcon className="w-7 h-7 mr-2" />
            Our Mission
          </h2>
          <p className="text-lg leading-relaxed">
            At OptiSupply, we believe ethical and sustainable decisions should
            be the foundation of every supply chain. Our mission is to empower
            companies with an AI-powered decision support tool that goes beyond
            cost to prioritize environmental impact, labor practices, and
            ethical sourcing.
          </p>
        </motion.div>

        <motion.div
          className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-xl p-8 mb-8"
          variants={cardVariants}
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-blue-400">
            <RocketLaunchIcon className="w-7 h-7 mr-2" />
            What We Do
          </h2>
          <p className="text-lg leading-relaxed">
            OptiSupply is an intelligent supplier selection tool that balances
            cost-efficiency with ethical and environmental criteria. By
            combining corporate values with AI optimization, OptiSupply helps
            decision-makers select suppliers who align with both strategic and
            sustainability goals.
          </p>
        </motion.div>

        <motion.div
          className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-xl p-8 mb-8"
          variants={cardVariants}
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-purple-400">
            <ScaleIcon className="w-7 h-7 mr-2" />
            How It Works
          </h2>
          <ul className="list-disc list-inside space-y-2 text-lg leading-relaxed">
            <li>
              Companies input supplier data including cost, environmental score,
              and ethical rating.
            </li>
            <li>
              Our AI engine evaluates and ranks suppliers based on customizable
              priorities.
            </li>
            <li>
              Users receive a transparent, data-driven recommendation that
              supports responsible sourcing.
            </li>
            <li>
              A dashboard helps track changes, analyze trade-offs, and visualize
              ethical value.
            </li>
          </ul>
        </motion.div>

        <motion.div
          className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-xl p-8 mb-8"
          variants={cardVariants}
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-green-400">
            <AcademicCapIcon className="w-7 h-7 mr-2" />
            Academic Foundations
          </h2>
          <p className="text-lg leading-relaxed">
            OptiSupply is rooted in academic research developed as part of an
            MBA thesis at Budapest Metropolitan University. It is designed to
            explore how AI can optimize ethical decision-making in real-world
            supply chain scenarios.
          </p>
        </motion.div>

        <motion.div
          className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-xl p-8 mb-8"
          variants={cardVariants}
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-orange-400">
            <LightBulbIcon className="w-7 h-7 mr-2" />
            Real-World Testing
          </h2>
          <p className="text-lg leading-relaxed">
            The app is currently undergoing pilot testing with two companies to
            evaluate its practical impact on supplier selection. Early results
            suggest that OptiSupply can shift decisions toward more sustainable
            and ethical options—without sacrificing efficiency.
          </p>
        </motion.div>

        <motion.div
          className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-xl p-8 mb-8"
          variants={cardVariants}
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-indigo-400">
            <UserIcon className="w-7 h-7 mr-2" />
            Created by
          </h2>
          <p className="text-lg leading-relaxed">
            Nima Afsharfar – MBA candidate, tech enthusiast, and AI ethics
            researcher.
          </p>
        </motion.div>

        <motion.div
          className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-xl p-8"
          variants={cardVariants}
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-pink-400">
            <ChatBubbleLeftRightIcon className="w-7 h-7 mr-2" />
            Want to Collaborate?
          </h2>
          <p className="text-lg leading-relaxed">
            We're actively looking for companies, researchers, and changemakers
            to test or co-develop OptiSupply. Let's build better supply
            chains—together.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OptiSupplyAboutPage;
