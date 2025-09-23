import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  GlobeAltIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  BellIcon,
  BellAlertIcon,
  ShieldExclamationIcon,
  FireIcon,
  CloudIcon,
  ScaleIcon,
  UserGroupIcon,
  XMarkIcon,
  MapIcon,
  ChartBarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import {
  getSuppliers,
  Supplier,
  getGeoRiskAlerts,
  GeoRiskAlert,
} from "../services/api";

// Risk categories with their color and icon
const riskTypes = {
  political: {
    color: "#ef4444",
    name: "Political Instability",
    icon: <ShieldExclamationIcon className="w-5 h-5" />,
    description: "Regions with political unrest, sanctions or instability",
  },
  environmental: {
    color: "#3b82f6",
    name: "Environmental Risk",
    icon: <CloudIcon className="w-5 h-5" />,
    description:
      "Areas with water scarcity, natural disasters or extreme climate vulnerability",
  },
  socialEthical: {
    color: "#8b5cf6",
    name: "Social/Ethical Concerns",
    icon: <UserGroupIcon className="w-5 h-5" />,
    description:
      "Regions with human rights issues, child labor or poor working conditions",
  },
  conflict: {
    color: "#f97316",
    name: "Active Conflicts",
    icon: <FireIcon className="w-5 h-5" />,
    description: "Areas with ongoing armed conflicts or civil unrest",
  },
  regulatory: {
    color: "#f59e0b",
    name: "Regulatory Changes",
    icon: <ScaleIcon className="w-5 h-5" />,
    description:
      "Recent or upcoming regulatory changes affecting business operations",
  },
};

// Mock country-specific risk data
const countryRiskData = {
  China: ["political", "socialEthical"],
  "United States": ["regulatory"],
  India: ["environmental", "socialEthical"],
  Russia: ["political", "conflict", "regulatory"],
  Brazil: ["environmental", "political"],
  Mexico: ["conflict", "socialEthical"],
  Ukraine: ["conflict", "political"],
  Bangladesh: ["environmental", "socialEthical"],
  Vietnam: ["political", "socialEthical"],
  Thailand: ["political", "environmental"],
  Egypt: ["political", "conflict"],
  "South Africa": ["environmental", "socialEthical"],
  Indonesia: ["environmental", "political"],
  Turkey: ["political", "regulatory"],
  Philippines: ["environmental", "conflict"],
  Pakistan: ["political", "conflict", "environmental"],
  Nigeria: ["conflict", "political", "environmental"],
};

// Mock geocoding data (country name -> lat/lng)
const countryCoordinates = {
  "United States": [38.89511, -77.03637],
  China: [39.90571, 116.39127],
  India: [28.61389, 77.209],
  Germany: [52.52437, 13.41053],
  "United Kingdom": [51.50853, -0.12574],
  UK: [51.50853, -0.12574], // Alias for UK
  France: [48.85661, 2.35222],
  Brazil: [-15.77972, -47.92972],
  Italy: [41.89193, 12.51133],
  Canada: [45.42351, -75.69989],
  Japan: [35.6895, 139.69171],
  "South Korea": [37.56639, 126.99977],
  Australia: [-35.28092, 149.13],
  Spain: [40.4167, -3.70332],
  Mexico: [19.42847, -99.12766],
  Indonesia: [-6.1744, 106.8294],
  Netherlands: [52.37022, 4.89517],
  "Saudi Arabia": [24.68859, 46.72204],
  Turkey: [39.93353, 32.85972],
  Switzerland: [46.94799, 7.44744],
  Poland: [52.22977, 21.01178],
  Thailand: [13.75249, 100.49351],
  Sweden: [59.33258, 18.06489],
  Belgium: [50.85034, 4.35171],
  Nigeria: [9.07648, 7.39859],
  Austria: [48.2082, 16.3738],
  Norway: [59.91603, 10.73874],
  "United Arab Emirates": [24.45385, 54.37729],
  Israel: [31.769, 35.21633],
  Ireland: [53.34976, -6.26026],
  Singapore: [1.35208, 103.81984],
  Vietnam: [21.02776, 105.83416],
  Malaysia: [3.13898, 101.68689],
  Denmark: [55.67592, 12.56553],
  Philippines: [14.59951, 120.98422],
  Pakistan: [33.69296, 73.0545],
  Colombia: [4.60971, -74.08175],
  Chile: [-33.44901, -70.66927],
  Finland: [60.16749, 24.94278],
  Bangladesh: [23.81032, 90.41249],
  Egypt: [30.04443, 31.23571],
  "South Africa": [-25.74787, 28.22932],
  "New Zealand": [-41.28874, 174.77721],
  Argentina: [-34.60368, -58.38157],
  Russia: [55.75045, 37.61742],
  Ukraine: [50.4501, 30.5234],
  Taiwan: [23.5, 121], // Added Taiwan coordinates
  Other: [0, 0],
};

// Convert lat/lng to 3D coordinates on a sphere
const latLngToVector3 = (lat: number, lng: number, radius: number) => {
  // Convert latitude and longitude to radians
  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);

  // Calculate 3D coordinates on sphere using standard spherical coordinates
  // phi = 90° - latitude (angle from z-axis)
  // theta = longitude (angle from x-axis)
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = lng * (Math.PI / 180);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
};

// Loading component for 3D content
const LoadingSpinner = () => (
  <Html center>
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-white text-lg">Loading Earth Globe...</p>
    </div>
  </Html>
);

// Earth component with proper texture
const Earth = ({ children }: { children?: React.ReactNode }) => {
  const earthRef = useRef<THREE.Group>(null);

  // Load Earth texture from a reliable source
  const earthTexture = useTexture(
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_atmos_2048.jpg"
  );

  // Smooth rotation
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={earthRef}>
      <mesh>
        <sphereGeometry args={[5, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      {children}
    </group>
  );
};

// Simple stable globe component
const Globe = ({ suppliers, activeRiskTypes, onCountryClick }: any) => {
  const globeRef = useRef<THREE.Group>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Create risk indicators
  const createRiskIndicators = () => {
    return Object.entries(countryRiskData).map(([country, risks]) => {
      const coordinates = countryCoordinates[country];
      if (!coordinates) return null;

      const position = latLngToVector3(coordinates[0], coordinates[1], 5.1);
      const activeRisks = risks.filter((risk) =>
        activeRiskTypes.includes(risk)
      );

      if (activeRisks.length === 0) return null;

      return (
        <group key={country} position={position}>
          {activeRisks.map((risk, index) => (
            <mesh
              key={`${country}-${risk}-${index}`}
              position={[0, 0, 0.1 * index]}
              onPointerOver={() => setHoveredCountry(country)}
              onPointerOut={() => setHoveredCountry(null)}
              onClick={() => {
                setSelectedCountry(country);
                onCountryClick(country);
              }}
            >
              <sphereGeometry args={[0.15 + index * 0.05, 16, 16]} />
              <meshBasicMaterial
                color={riskTypes[risk].color}
                transparent
                opacity={0.8}
              />
            </mesh>
          ))}
        </group>
      );
    });
  };

  // Create supplier indicators
  const createSupplierIndicators = () => {
    return suppliers.map((supplier) => {
      const coordinates = countryCoordinates[supplier.country];
      if (!coordinates) return null;

      const position = latLngToVector3(coordinates[0], coordinates[1], 5.05);
      const score = supplier.ethical_score || 0.5;

      return (
        <group key={supplier.id} position={position}>
          <mesh
            onPointerOver={() => setHoveredCountry(supplier.country)}
            onPointerOut={() => setHoveredCountry(null)}
            onClick={() => {
              setSelectedCountry(supplier.country);
              onCountryClick(supplier.country);
            }}
          >
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial
              color={
                score > 0.7 ? "#10b981" : score > 0.4 ? "#f59e0b" : "#ef4444"
              }
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      );
    });
  };

  return (
    <group ref={globeRef}>
      {/* Earth with proper texture and rotating indicators */}
      <Earth>
        {/* Risk and supplier indicators */}
        {createRiskIndicators()}
        {createSupplierIndicators()}
      </Earth>

      {/* Hover tooltip */}
      {hoveredCountry && (
        <Html position={[0, 6, 0]}>
          <div className="bg-black/90 text-white p-3 rounded-lg shadow-lg border border-gray-600">
            <p className="font-semibold">{hoveredCountry}</p>
            <p className="text-sm text-gray-300">
              Risks: {countryRiskData[hoveredCountry]?.join(", ") || "None"}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
};

const GeoRiskMapping = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRiskTypes, setActiveRiskTypes] = useState<string[]>(
    Object.keys(riskTypes)
  );
  const [alerts, setAlerts] = useState<GeoRiskAlert[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"globe" | "map" | "chart">("globe");
  const [showAlerts, setShowAlerts] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [suppliersData, alertsData] = await Promise.all([
          getSuppliers(),
          getGeoRiskAlerts(),
        ]);
        setSuppliers(suppliersData);
        setAlerts(alertsData);
        setError(null);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const toggleRiskType = (riskType: string) => {
    setActiveRiskTypes((prev) =>
      prev.includes(riskType)
        ? prev.filter((type) => type !== riskType)
        : [...prev, riskType]
    );
  };

  const handleCountryClick = (country: string) => {
    setSelectedCountry(country);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="relative w-full h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Geo Risk Mapping...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative w-full h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Error Loading Data</p>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Global Risk Mapping</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewMode("globe")}
              className={`p-2 rounded-full ${
                viewMode === "globe" ? "bg-blue-500" : "bg-gray-700"
              } hover:bg-blue-600`}
            >
              <GlobeAltIcon className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`p-2 rounded-full ${
                viewMode === "map" ? "bg-blue-500" : "bg-gray-700"
              } hover:bg-blue-600`}
            >
              <MapIcon className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setViewMode("chart")}
              className={`p-2 rounded-full ${
                viewMode === "chart" ? "bg-blue-500" : "bg-gray-700"
              } hover:bg-blue-600`}
            >
              <ChartBarIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative w-full h-full pt-16">
        {/* 3D Globe */}
        {viewMode === "globe" && (
          <div className="w-full h-full">
            <Canvas
              camera={{ position: [0, 0, 15], fov: 45 }}
              gl={{ antialias: true, alpha: false }}
            >
              <Suspense fallback={<LoadingSpinner />}>
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={1.2} />
                <pointLight position={[-10, -10, -10]} intensity={0.8} />

                {/* Stars background */}
                <Stars
                  radius={100}
                  depth={50}
                  count={3000}
                  factor={4}
                  saturation={0}
                  fade
                />

                {/* Main globe */}
                <Globe
                  suppliers={suppliers}
                  activeRiskTypes={activeRiskTypes}
                  onCountryClick={handleCountryClick}
                />

                {/* Camera controls */}
                <OrbitControls
                  enableZoom={true}
                  enablePan={true}
                  enableRotate={true}
                  zoomSpeed={0.6}
                  panSpeed={0.5}
                  rotateSpeed={0.4}
                  minDistance={8}
                  maxDistance={25}
                />
              </Suspense>
            </Canvas>
          </div>
        )}

        {/* Risk Type Filter */}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
          <h2 className="text-white font-semibold mb-2">Risk Types</h2>
          <div className="space-y-2">
            {Object.entries(riskTypes).map(([type, data]) => (
              <button
                key={type}
                onClick={() => toggleRiskType(type)}
                className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                  activeRiskTypes.includes(type)
                    ? "bg-opacity-20"
                    : "bg-opacity-10"
                } ${
                  activeRiskTypes.includes(type) ? data.color : "bg-gray-700"
                }`}
              >
                <span
                  className={`w-5 h-5 ${
                    activeRiskTypes.includes(type)
                      ? data.color
                      : "text-gray-400"
                  }`}
                >
                  {data.icon}
                </span>
                <span className="text-white">{data.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts Panel */}
        <AnimatePresence>
          {showAlerts && (
            <motion.div
              key="alerts-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="absolute top-20 right-4 w-96 bg-black/50 backdrop-blur-sm rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-semibold">Risk Alerts</h2>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {alerts.map((alert, idx) => (
                  <motion.div
                    key={(alert as any)._id || (alert as any).id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 rounded p-3"
                  >
                    <div className="flex items-start space-x-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          riskTypes[alert.type]?.color || "bg-gray-600"
                        }`}
                      >
                        {riskTypes[alert.type]?.icon || (
                          <BellIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">
                          {alert.title}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {alert.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-gray-500 text-xs">
                            {alert.country}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {alert.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Country Details */}
        <AnimatePresence>
          {selectedCountry && (
            <motion.div
              key="country-details"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-4 right-4 w-96 bg-black/50 backdrop-blur-sm rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-semibold">{selectedCountry}</h2>
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-gray-400 text-sm mb-2">Active Risks</h3>
                  <div className="flex flex-wrap gap-2">
                    {countryRiskData[selectedCountry]?.map((risk) => (
                      <span
                        key={risk}
                        className={`px-2 py-1 rounded-full text-xs ${
                          riskTypes[risk]?.color || "bg-gray-600"
                        }`}
                      >
                        {riskTypes[risk]?.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm mb-2">Suppliers</h3>
                  <div className="space-y-2">
                    {suppliers
                      .filter((s) => s.country === selectedCountry)
                      .map((supplier) => (
                        <div
                          key={(supplier as any)._id || (supplier as any).id}
                          className="bg-gray-800/50 rounded p-2"
                        >
                          <p className="text-white">{supplier.name}</p>
                          <p className="text-gray-400 text-sm">
                            Score: {supplier.ethical_score}%
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GeoRiskMapping;
