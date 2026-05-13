import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, useTexture } from "@react-three/drei";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  GlobeAltIcon,
  ExclamationTriangleIcon,
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
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  getSuppliers,
  Supplier,
  getGeoRiskAlerts,
  GeoRiskAlert,
} from "../services/api";
import { useThemeColors } from "../theme/useThemeColors";
import { useTheme } from "../contexts/ThemeContext";

// Risk categories — updated palette to match site theme
const riskTypes: Record<
  string,
  { color: string; name: string; icon: React.ReactNode; description: string }
> = {
  political: {
    color: "#E84545",
    name: "Political Instability",
    icon: <ShieldExclamationIcon className="w-4 h-4" />,
    description: "Regions with political unrest, sanctions or instability",
  },
  environmental: {
    color: "#C8F05A",
    name: "Environmental Risk",
    icon: <CloudIcon className="w-4 h-4" />,
    description:
      "Areas with water scarcity, natural disasters or extreme climate vulnerability",
  },
  socialEthical: {
    color: "#FBBF24",
    name: "Social / Ethical",
    icon: <UserGroupIcon className="w-4 h-4" />,
    description:
      "Regions with human rights issues, child labor or poor working conditions",
  },
  conflict: {
    color: "#FB923C",
    name: "Active Conflicts",
    icon: <FireIcon className="w-4 h-4" />,
    description: "Areas with ongoing armed conflicts or civil unrest",
  },
  regulatory: {
    color: "#86EFAC",
    name: "Regulatory Changes",
    icon: <ScaleIcon className="w-4 h-4" />,
    description:
      "Recent or upcoming regulatory changes affecting business operations",
  },
};

const countryRiskData: Record<string, string[]> = {
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

const countryCoordinates: Record<string, [number, number]> = {
  "United States": [38.89511, -77.03637],
  China: [39.90571, 116.39127],
  India: [28.61389, 77.209],
  Germany: [52.52437, 13.41053],
  "United Kingdom": [51.50853, -0.12574],
  UK: [51.50853, -0.12574],
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
  Taiwan: [23.5, 121],
  Other: [0, 0],
};

const latLngToVector3 = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = lng * (Math.PI / 180);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
};

// Globe loading fallback
const GlobeLoader = () => (
  <Html center>
    <div className="flex flex-col items-center gap-3">
      <div
        className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "#C8F05A", borderTopColor: "transparent" }}
      />
      <p
        className="text-sm font-medium"
        style={{ color: "#808080", letterSpacing: "0.05em" }}
      >
        Loading globe…
      </p>
    </div>
  </Html>
);

const Earth = ({ children }: { children?: React.ReactNode }) => {
  const earthRef = useRef<THREE.Group>(null);
  const earthTexture = useTexture(
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_atmos_2048.jpg",
  );
  useFrame(() => {
    if (earthRef.current) earthRef.current.rotation.y += 0.0015;
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

const GlobeScene = ({
  suppliers,
  activeRiskTypes,
  onCountryClick,
}: {
  suppliers: Supplier[];
  activeRiskTypes: string[];
  onCountryClick: (c: string) => void;
}) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const riskMarkers = Object.entries(countryRiskData).flatMap(
    ([country, risks]) => {
      const coords = countryCoordinates[country];
      if (!coords) return [];
      const activeRisks = risks.filter((r) => activeRiskTypes.includes(r));
      if (!activeRisks.length) return [];
      const pos = latLngToVector3(coords[0], coords[1], 5.1);
      return activeRisks.map((risk, i) => (
        <group key={`${country}-${risk}`} position={pos}>
          <mesh
            position={[0, 0, 0.08 * i]}
            onPointerOver={() => setHoveredCountry(country)}
            onPointerOut={() => setHoveredCountry(null)}
            onClick={() => onCountryClick(country)}
          >
            <sphereGeometry args={[0.14 + i * 0.04, 16, 16]} />
            <meshBasicMaterial
              color={riskTypes[risk]?.color ?? "#888"}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      ));
    },
  );

  const supplierMarkers = suppliers.map((s) => {
    const coords = countryCoordinates[s.country ?? ""];
    if (!coords) return null;
    const pos = latLngToVector3(coords[0], coords[1], 5.05);
    const score = s.ethical_score ?? 0.5;
    return (
      <group key={(s as any)._id ?? (s as any).id} position={pos}>
        <mesh
          onPointerOver={() => setHoveredCountry(s.country ?? null)}
          onPointerOut={() => setHoveredCountry(null)}
          onClick={() => onCountryClick(s.country ?? "")}
        >
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial
            color={
              score > 0.7 ? "#C8F05A" : score > 0.4 ? "#FBBF24" : "#E84545"
            }
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>
    );
  });

  return (
    <group>
      <Earth>
        {riskMarkers}
        {supplierMarkers}
      </Earth>
      {hoveredCountry && (
        <Html position={[0, 6.5, 0]}>
          <div
            className="px-3 py-2 rounded-lg text-sm shadow-xl whitespace-nowrap"
            style={{
              background: "rgba(10,10,10,0.95)",
              border: "1px solid rgba(200,240,90,0.25)",
              color: "#F5F5F0",
              fontFamily: '"Geist", sans-serif',
            }}
          >
            <p className="font-semibold" style={{ letterSpacing: "-0.01em" }}>
              {hoveredCountry}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#808080" }}>
              {countryRiskData[hoveredCountry]
                ?.map((r) => riskTypes[r]?.name)
                .join(" · ") || "No active risks"}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
};

// ─── Risk score badge ─────────────────────────────────────────────────────────
const getRiskBadge = (risks: string[]) => {
  if (!risks || risks.length === 0)
    return { label: "Clear", color: "#4ADE80", bg: "rgba(74,222,128,0.12)" };
  if (risks.length >= 3)
    return { label: "Critical", color: "#E84545", bg: "rgba(232,69,69,0.12)" };
  if (risks.length === 2)
    return { label: "High", color: "#FB923C", bg: "rgba(251,146,60,0.12)" };
  return { label: "Medium", color: "#FBBF24", bg: "rgba(251,191,36,0.12)" };
};

// ─── Main page ────────────────────────────────────────────────────────────────
const GeoRiskMapping = () => {
  useEffect(() => {
    document.title = "OptiSupply — Geo Risk Mapping";
  }, []);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRiskTypes, setActiveRiskTypes] = useState<string[]>(
    Object.keys(riskTypes),
  );
  const [alerts, setAlerts] = useState<GeoRiskAlert[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"globe" | "map" | "chart">("globe");
  const [showAlerts, setShowAlerts] = useState(true);
  const colors = useThemeColors() as any;
  const { darkMode } = useTheme();

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
        setError(
          "Failed to load geo-risk data. Check your connection and try again.",
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleRiskType = (type: string) =>
    setActiveRiskTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: colors.background }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#C8F05A", borderTopColor: "transparent" }}
          />
          <div className="text-center">
            <p
              className="text-sm font-semibold"
              style={{ color: colors.text, letterSpacing: "-0.01em" }}
            >
              Loading Geo Risk Intelligence
            </p>
            <p
              className="text-[11px] mt-1 uppercase"
              style={{ color: "#808080", letterSpacing: "0.08em" }}
            >
              Fetching global data…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: colors.background }}
      >
        <div
          className="max-w-sm w-full mx-4 p-8 rounded-xl text-center"
          style={{
            background: colors.card,
            border: "1px solid rgba(232,69,69,0.20)",
          }}
        >
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "rgba(232,69,69,0.10)",
              border: "1px solid rgba(232,69,69,0.20)",
            }}
          >
            <ExclamationTriangleIcon
              className="h-7 w-7"
              style={{ color: "#E84545" }}
            />
          </div>
          <h2
            className="text-base font-semibold mb-2"
            style={{ color: colors.text, letterSpacing: "-0.01em" }}
          >
            Data Unavailable
          </h2>
          <p className="text-[13px] mb-5" style={{ color: "#808080" }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-opacity hover:opacity-85"
            style={{ background: "#C8F05A", color: "#0A0A0A" }}
          >
            <ArrowPathIcon className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Chart data ───────────────────────────────────────────────────────────
  const alertsByType = Object.keys(riskTypes).map((t) => ({
    type: riskTypes[t].name,
    count: alerts.filter((a) => a.type === t).length,
    color: riskTypes[t].color,
  }));
  const countriesByRisk = Object.entries(countryRiskData)
    .map(([c, risks]) => ({ country: c, risks: risks.length }))
    .sort((a, b) => b.risks - a.risks)
    .slice(0, 12);

  const panelStyle = {
    background: darkMode ? "rgba(10,10,10,0.88)" : "rgba(245,245,240,0.92)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
  };

  const tickColor = darkMode ? "#808080" : "#555555";
  const gridColor = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: "100dvh",
        backgroundColor: colors.background,
        color: colors.text,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 h-14 flex items-center justify-between"
        style={{
          background: darkMode
            ? "rgba(10,10,10,0.85)"
            : "rgba(245,245,240,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: darkMode
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Title */}
        <div className="flex items-center gap-3">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
            style={{
              background: "rgba(232,69,69,0.15)",
              border: "1px solid rgba(232,69,69,0.25)",
            }}
          >
            <GlobeAltIcon className="h-4 w-4" style={{ color: "#E84545" }} />
          </div>
          <div>
            <h1
              className="text-[14px] font-semibold leading-tight"
              style={{ color: colors.text, letterSpacing: "-0.01em" }}
            >
              Geo Risk Intelligence
            </h1>
            <p
              className="text-[10px] uppercase"
              style={{ color: "#808080", letterSpacing: "0.08em" }}
            >
              {suppliers.length} suppliers ·{" "}
              {Object.keys(countryRiskData).length} risk zones
            </p>
          </div>
        </div>

        {/* View mode + alerts toggle */}
        <div className="flex items-center gap-1.5">
          {/* View mode pill */}
          <div
            className="flex items-center p-0.5 rounded-md gap-0.5"
            style={{
              border: "1px solid rgba(128,128,128,0.12)",
              background: "rgba(128,128,128,0.04)",
            }}
          >
            {(["globe", "map", "chart"] as const).map((mode) => {
              const icons = {
                globe: <GlobeAltIcon className="h-4 w-4" />,
                map: <MapIcon className="h-4 w-4" />,
                chart: <ChartBarIcon className="h-4 w-4" />,
              };
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all capitalize"
                  style={
                    viewMode === mode
                      ? { background: "#C8F05A", color: "#0A0A0A" }
                      : { color: "#808080" }
                  }
                >
                  {icons[mode]}
                  <span className="hidden sm:inline">
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div
            className="h-5 w-px mx-0.5"
            style={{ background: "rgba(128,128,128,0.15)" }}
          />

          {/* Alerts toggle */}
          <button
            onClick={() => setShowAlerts((v) => !v)}
            className="h-8 w-8 flex items-center justify-center rounded-md transition-colors"
            style={{
              background: showAlerts ? "rgba(200,240,90,0.12)" : "transparent",
              border: showAlerts
                ? "1px solid rgba(200,240,90,0.25)"
                : "1px solid transparent",
            }}
            title={showAlerts ? "Hide alerts" : "Show alerts"}
          >
            {showAlerts ? (
              <BellAlertIcon className="h-4 w-4" style={{ color: "#C8F05A" }} />
            ) : (
              <BellIcon className="h-4 w-4" style={{ color: "#808080" }} />
            )}
          </button>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="absolute inset-0 top-14">
        {/* Globe view */}
        {viewMode === "globe" && (
          <Canvas
            camera={{ position: [0, 0, 15], fov: 45 }}
            gl={{ antialias: true, alpha: false }}
            style={{ background: colors.background }}
          >
            <Suspense fallback={<GlobeLoader />}>
              <ambientLight intensity={0.55} />
              <pointLight position={[10, 10, 10]} intensity={1.2} />
              <pointLight position={[-10, -10, -10]} intensity={0.6} />
              <Stars
                radius={100}
                depth={50}
                count={2500}
                factor={4}
                saturation={0}
                fade
              />
              <GlobeScene
                suppliers={suppliers}
                activeRiskTypes={activeRiskTypes}
                onCountryClick={setSelectedCountry}
              />
              <OrbitControls
                enableZoom
                enablePan={false}
                enableRotate
                zoomSpeed={0.5}
                rotateSpeed={0.4}
                minDistance={8}
                maxDistance={24}
              />
            </Suspense>
          </Canvas>
        )}

        {/* Map view — country risk grid */}
        {viewMode === "map" && (
          <div className="h-full overflow-auto p-4 sm:p-6">
            <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Object.entries(countryCoordinates)
                  .filter(([c]) => c !== "Other")
                  .sort(
                    (a, b) =>
                      (countryRiskData[b[0]]?.length || 0) -
                      (countryRiskData[a[0]]?.length || 0),
                  )
                  .map(([country]) => {
                    const risks = countryRiskData[country] || [];
                    const supplierCount = suppliers.filter(
                      (s) => s.country === country,
                    ).length;
                    const badge = getRiskBadge(risks);
                    return (
                      <motion.button
                        key={country}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-left p-4 rounded-lg transition-all hover:ring-1"
                        style={
                          {
                            background: colors.card,
                            border: `1px solid ${risks.length > 0 ? "rgba(128,128,128,0.10)" : "rgba(128,128,128,0.07)"}`,
                            "--tw-ring-color": colors.primary + "30",
                          } as any
                        }
                        onClick={() => setSelectedCountry(country)}
                      >
                        {/* Country + badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3
                            className="text-[13px] font-semibold leading-tight"
                            style={{
                              color: colors.text,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {country}
                          </h3>
                          <span
                            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              letterSpacing: "0.07em",
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Risk pills */}
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {risks.length === 0 ? (
                            <span
                              className="text-[10px] uppercase font-medium"
                              style={{
                                color: "#808080",
                                letterSpacing: "0.06em",
                              }}
                            >
                              No active risks
                            </span>
                          ) : (
                            risks.map((r) => (
                              <span
                                key={r}
                                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded"
                                style={{
                                  background: riskTypes[r]?.color + "20",
                                  color: riskTypes[r]?.color,
                                  border: `1px solid ${riskTypes[r]?.color}30`,
                                }}
                              >
                                {riskTypes[r]?.icon}
                                <span style={{ letterSpacing: "0.03em" }}>
                                  {riskTypes[r]?.name}
                                </span>
                              </span>
                            ))
                          )}
                        </div>

                        {/* Supplier count */}
                        {supplierCount > 0 && (
                          <div
                            className="text-[11px] font-medium"
                            style={{ color: "#808080" }}
                          >
                            {supplierCount} supplier
                            {supplierCount > 1 ? "s" : ""}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Chart view */}
        {viewMode === "chart" && (
          <div className="h-full overflow-auto p-4 sm:p-6">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Alerts by type */}
              <div
                className="p-5 rounded-lg"
                style={{
                  background: colors.card,
                  border: "1px solid rgba(128,128,128,0.10)",
                }}
              >
                <div className="mb-4">
                  <p
                    className="text-[10px] uppercase font-semibold"
                    style={{ color: "#808080", letterSpacing: "0.09em" }}
                  >
                    Risk Alerts
                  </p>
                  <h3
                    className="text-[15px] font-semibold mt-0.5"
                    style={{ color: colors.text, letterSpacing: "-0.01em" }}
                  >
                    Alerts by Type
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={alertsByType}
                      margin={{ top: 4, right: 8, left: -8, bottom: 4 }}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid
                        stroke={gridColor}
                        strokeDasharray="0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="type"
                        tick={{
                          fontSize: 10,
                          fill: tickColor,
                          fontFamily: '"Geist", sans-serif',
                        }}
                        axisLine={false}
                        tickLine={false}
                        angle={-20}
                        height={50}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{
                          fontSize: 10,
                          fill: tickColor,
                          fontFamily: '"Geist Mono", monospace',
                        }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        width={24}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(200,240,90,0.04)" }}
                        contentStyle={{
                          background: darkMode
                            ? "rgba(10,10,10,0.97)"
                            : "rgba(245,245,240,0.97)",
                          border: "1px solid rgba(128,128,128,0.12)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontFamily: '"Geist", sans-serif',
                          color: colors.text,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Alerts"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={36}
                        fill="#C8F05A"
                        fillOpacity={0.85}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Countries by risk count */}
              <div
                className="p-5 rounded-lg"
                style={{
                  background: colors.card,
                  border: "1px solid rgba(128,128,128,0.10)",
                }}
              >
                <div className="mb-4">
                  <p
                    className="text-[10px] uppercase font-semibold"
                    style={{ color: "#808080", letterSpacing: "0.09em" }}
                  >
                    Country Exposure
                  </p>
                  <h3
                    className="text-[15px] font-semibold mt-0.5"
                    style={{ color: colors.text, letterSpacing: "-0.01em" }}
                  >
                    Risk Concentration
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={countriesByRisk}
                      layout="vertical"
                      margin={{ top: 4, right: 8, left: 56, bottom: 4 }}
                      barCategoryGap="28%"
                    >
                      <CartesianGrid
                        stroke={gridColor}
                        strokeDasharray="0"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{
                          fontSize: 10,
                          fill: tickColor,
                          fontFamily: '"Geist Mono", monospace',
                        }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        dataKey="country"
                        type="category"
                        tick={{
                          fontSize: 10,
                          fill: tickColor,
                          fontFamily: '"Geist", sans-serif',
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                        interval={0}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(200,240,90,0.04)" }}
                        contentStyle={{
                          background: darkMode
                            ? "rgba(10,10,10,0.97)"
                            : "rgba(245,245,240,0.97)",
                          border: "1px solid rgba(128,128,128,0.12)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontFamily: '"Geist", sans-serif',
                          color: colors.text,
                        }}
                      />
                      <Bar
                        dataKey="risks"
                        name="Risk types"
                        radius={[0, 3, 3, 0]}
                        maxBarSize={18}
                        fill="#E84545"
                        fillOpacity={0.8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Risk summary stats */}
              <div
                className="lg:col-span-2 p-5 rounded-lg"
                style={{
                  background: colors.card,
                  border: "1px solid rgba(128,128,128,0.10)",
                }}
              >
                <div className="mb-4">
                  <p
                    className="text-[10px] uppercase font-semibold"
                    style={{ color: "#808080", letterSpacing: "0.09em" }}
                  >
                    Overview
                  </p>
                  <h3
                    className="text-[15px] font-semibold mt-0.5"
                    style={{ color: colors.text, letterSpacing: "-0.01em" }}
                  >
                    Risk Type Summary
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(riskTypes).map(([key, rt]) => {
                    const count = alerts.filter((a) => a.type === key).length;
                    const countries = Object.entries(countryRiskData).filter(
                      ([, r]) => r.includes(key),
                    ).length;
                    return (
                      <div
                        key={key}
                        className="p-3 rounded-md"
                        style={{
                          background: rt.color + "10",
                          border: `1px solid ${rt.color}22`,
                          borderLeft: `3px solid ${rt.color}`,
                        }}
                      >
                        <div
                          className="flex items-center gap-1.5 mb-2"
                          style={{ color: rt.color }}
                        >
                          {rt.icon}
                          <span
                            className="text-[10px] font-bold uppercase"
                            style={{ letterSpacing: "0.06em" }}
                          >
                            {rt.name}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex justify-between items-center">
                            <span
                              className="text-[10px]"
                              style={{ color: "#808080" }}
                            >
                              Alerts
                            </span>
                            <span
                              className="text-[14px] font-bold font-mono"
                              style={{ color: rt.color }}
                            >
                              {count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span
                              className="text-[10px]"
                              style={{ color: "#808080" }}
                            >
                              Countries
                            </span>
                            <span
                              className="text-[14px] font-bold font-mono"
                              style={{ color: rt.color }}
                            >
                              {countries}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Globe overlays (only in globe mode) ─────────────────────────── */}
      {viewMode === "globe" && (
        <>
          {/* Risk filter panel — bottom left */}
          <div
            className="absolute bottom-4 left-4 z-20 p-4 rounded-lg w-52"
            style={panelStyle}
          >
            <p
              className="text-[10px] uppercase font-semibold mb-3"
              style={{ color: "#808080", letterSpacing: "0.09em" }}
            >
              Risk Filters
            </p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(riskTypes).map(([type, data]) => {
                const active = activeRiskTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleRiskType(type)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all text-[12px] font-medium"
                    style={{
                      background: active
                        ? data.color + "18"
                        : "rgba(128,128,128,0.05)",
                      border: active
                        ? `1px solid ${data.color}30`
                        : "1px solid rgba(128,128,128,0.08)",
                      color: active ? data.color : "#808080",
                      opacity: active ? 1 : 0.6,
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        background: active
                          ? data.color
                          : "rgba(128,128,128,0.4)",
                      }}
                    />
                    {data.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend — bottom right (when alerts hidden) */}
          {!showAlerts && (
            <div
              className="absolute bottom-4 right-4 z-20 p-3 rounded-lg"
              style={panelStyle}
            >
              <p
                className="text-[10px] uppercase font-semibold mb-2"
                style={{ color: "#808080", letterSpacing: "0.09em" }}
              >
                Supplier Score
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "High ESG", color: "#C8F05A" },
                  { label: "Medium ESG", color: "#FBBF24" },
                  { label: "At Risk", color: "#E84545" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: l.color }}
                    />
                    <span className="text-[11px]" style={{ color: "#808080" }}>
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Alerts panel — slide in from right ──────────────────────────── */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            key="alerts-panel"
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            exit={{ x: "110%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-14 right-0 bottom-0 z-20 w-72 flex flex-col"
            style={panelStyle}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(128,128,128,0.08)" }}
            >
              <div>
                <p
                  className="text-[10px] uppercase font-semibold"
                  style={{ color: "#808080", letterSpacing: "0.09em" }}
                >
                  Live Feed
                </p>
                <h2
                  className="text-[13px] font-semibold"
                  style={{ color: colors.text, letterSpacing: "-0.01em" }}
                >
                  Risk Alerts
                  <span
                    className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(232,69,69,0.15)",
                      color: "#E84545",
                    }}
                  >
                    {alerts.length}
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setShowAlerts(false)}
                className="h-6 w-6 flex items-center justify-center rounded transition-colors hover:opacity-70"
                style={{ color: "#808080" }}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Alert list */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                  <BellIcon className="h-8 w-8" style={{ color: "#808080" }} />
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#808080" }}
                  >
                    No active alerts
                  </p>
                </div>
              ) : (
                alerts.map((alert, idx) => {
                  const rt = riskTypes[alert.type];
                  return (
                    <motion.div
                      key={(alert as any)._id ?? (alert as any).id ?? idx}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="p-3 rounded-md"
                      style={{
                        background: rt
                          ? rt.color + "0C"
                          : "rgba(128,128,128,0.05)",
                        border: `1px solid ${rt ? rt.color + "25" : "rgba(128,128,128,0.10)"}`,
                        borderLeft: `3px solid ${rt?.color ?? "#808080"}`,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="shrink-0 h-6 w-6 rounded flex items-center justify-center mt-0.5"
                          style={{
                            background: rt
                              ? rt.color + "20"
                              : "rgba(128,128,128,0.10)",
                            color: rt?.color ?? "#808080",
                          }}
                        >
                          {rt?.icon ?? <BellIcon className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-[12px] font-semibold leading-tight"
                            style={{
                              color: colors.text,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {alert.title}
                          </p>
                          <p
                            className="text-[11px] mt-0.5 leading-snug"
                            style={{ color: "#808080" }}
                          >
                            {alert.description}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span
                              className="text-[10px] font-semibold uppercase"
                              style={{
                                color: rt?.color ?? "#808080",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {alert.country}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{ color: "#808080" }}
                            >
                              {alert.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Country detail panel — slide in from bottom ──────────────────── */}
      <AnimatePresence>
        {selectedCountry && (
          <motion.div
            key="country-details"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-4 right-4 z-30 w-80 rounded-xl overflow-hidden"
            style={{
              ...panelStyle,
              borderRadius: "10px",
            }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(128,128,128,0.08)" }}
            >
              <div>
                <p
                  className="text-[10px] uppercase font-semibold"
                  style={{ color: "#808080", letterSpacing: "0.09em" }}
                >
                  Country Detail
                </p>
                <h2
                  className="text-[14px] font-semibold"
                  style={{ color: colors.text, letterSpacing: "-0.01em" }}
                >
                  {selectedCountry}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                className="h-6 w-6 flex items-center justify-center rounded transition-opacity hover:opacity-70"
                style={{ color: "#808080" }}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-4 flex flex-col gap-4">
              {/* Active risks */}
              <div>
                <p
                  className="text-[10px] uppercase font-semibold mb-2"
                  style={{ color: "#808080", letterSpacing: "0.09em" }}
                >
                  Active Risks
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(countryRiskData[selectedCountry] ?? []).length === 0 ? (
                    <span
                      className="text-[11px] px-2 py-1 rounded"
                      style={{
                        background: "rgba(74,222,128,0.10)",
                        color: "#4ADE80",
                        border: "1px solid rgba(74,222,128,0.20)",
                      }}
                    >
                      No active risks
                    </span>
                  ) : (
                    countryRiskData[selectedCountry]?.map((risk) => {
                      const rt = riskTypes[risk];
                      return (
                        <span
                          key={risk}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded"
                          style={{
                            background: rt?.color + "18",
                            color: rt?.color ?? "#808080",
                            border: `1px solid ${rt?.color ?? "#808080"}28`,
                          }}
                        >
                          {rt?.icon}
                          {rt?.name ?? risk}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Suppliers in country */}
              <div>
                <p
                  className="text-[10px] uppercase font-semibold mb-2"
                  style={{ color: "#808080", letterSpacing: "0.09em" }}
                >
                  Suppliers (
                  {
                    suppliers.filter((s) => s.country === selectedCountry)
                      .length
                  }
                  )
                </p>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {suppliers
                    .filter((s) => s.country === selectedCountry)
                    .slice(0, 10)
                    .map((s) => {
                      const score = s.ethical_score ?? 0;
                      const scoreColor =
                        score > 70
                          ? "#C8F05A"
                          : score > 40
                            ? "#FBBF24"
                            : "#E84545";
                      return (
                        <div
                          key={(s as any)._id ?? (s as any).id}
                          className="flex items-center justify-between px-3 py-2 rounded-md"
                          style={{
                            background: "rgba(128,128,128,0.06)",
                            border: "1px solid rgba(128,128,128,0.08)",
                          }}
                        >
                          <p
                            className="text-[12px] font-medium truncate flex-1"
                            style={{
                              color: colors.text,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {s.name}
                          </p>
                          <span
                            className="text-[12px] font-bold font-mono ml-2 shrink-0"
                            style={{ color: scoreColor }}
                          >
                            {score.toFixed(0)}
                          </span>
                        </div>
                      );
                    })}
                  {suppliers.filter((s) => s.country === selectedCountry)
                    .length === 0 && (
                    <p className="text-[12px]" style={{ color: "#808080" }}>
                      No suppliers in this country
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeoRiskMapping;
