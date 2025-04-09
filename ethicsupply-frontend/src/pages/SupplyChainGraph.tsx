import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSupplyChainGraphData,
  GraphNode,
  GraphLink,
  GraphData,
} from "../services/api";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture, Html } from "@react-three/drei";
import Globe from "three-globe";
import * as THREE from "three";
import { OrbitControls as DreiOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Network,
  Globe as GlobeIcon, // Renamed to avoid conflict
  Maximize,
  Minimize,
  AlertTriangle,
  RefreshCw,
  Info,
  Eye,
  EyeOff,
  Filter,
  Search,
  SlidersHorizontal,
  Loader,
  Sun,
  Moon,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

// Extended interfaces (keep relevant parts, add lat/lng)
interface NodeObject extends GraphNode {
  lat?: number;
  lng?: number;
  // Keep other relevant fields if needed, e.g., ethical_score
}

interface LinkObject extends GraphLink {
  // Ensure source/target are consistently handled if they might be objects
  source: string | { id: string; lat?: number; lng?: number };
  target: string | { id: string; lat?: number; lng?: number };
}

// Extended graph data interface
interface ExtendedGraphData extends GraphData {
  isMockData?: boolean;
  nodes: NodeObject[];
  links: LinkObject[];
}

// Helper to get node coordinates
const getNodeCoords = (
  nodeIdentifier: string | { id: string; lat?: number; lng?: number },
  nodes: NodeObject[]
): { lat: number; lng: number } | null => {
  const nodeId =
    typeof nodeIdentifier === "string" ? nodeIdentifier : nodeIdentifier.id;
  const node = nodes.find((n) => n.id === nodeId);
  if (node && node.lat !== undefined && node.lng !== undefined) {
    return { lat: node.lat, lng: node.lng };
  }
  return null;
};

// New component for the Earth
const Earth = ({ nodes, links, onNodeHover, onNodeClick }) => {
  const earthRef = useRef();
  const { camera } = useThree();
  const [hoveredNode, setHoveredNode] = useState(null);

  // Load Earth textures
  const [earthTexture, bumpMap, specularMap] = useTexture([
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg",
  ]);

  // Convert lat/lng to 3D coordinates
  const latLngToVector3 = (lat, lng, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  // Create animated arcs
  const createArc = (start, end, color) => {
    const curve = new THREE.CatmullRomCurve3([
      start,
      start
        .clone()
        .lerp(end, 0.5)
        .add(new THREE.Vector3(0, 1, 0).multiplyScalar(0.5)),
      end,
    ]);

    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
    });
    return new THREE.Line(geometry, material);
  };

  // Animation loop
  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={earthRef}>
      {/* Earth */}
      <mesh>
        <sphereGeometry args={[5, 64, 64]} />
        <meshPhongMaterial
          map={earthTexture}
          bumpMap={bumpMap}
          bumpScale={0.5}
          specularMap={specularMap}
          specular={new THREE.Color("grey")}
          shininess={5}
        />
      </mesh>

      {/* Nodes */}
      {nodes.map((node) => {
        const position = latLngToVector3(node.lat, node.lng, 5.1);
        const color =
          node.ethical_score > 75
            ? "#4ade80"
            : node.ethical_score > 50
            ? "#fbbf24"
            : "#f87171";

        return (
          <mesh
            key={node.id}
            position={position}
            onPointerOver={() => {
              setHoveredNode(node);
              onNodeHover(node);
            }}
            onPointerOut={() => {
              setHoveredNode(null);
              onNodeHover(null);
            }}
            onClick={() => onNodeClick(node)}
          >
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}

      {/* Links */}
      {links.map((link, index) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (!sourceNode || !targetNode) return null;

        const start = latLngToVector3(sourceNode.lat, sourceNode.lng, 5.1);
        const end = latLngToVector3(targetNode.lat, targetNode.lng, 5.1);
        const color = link.ethical ? "#4ade80" : "#f87171";

        return <primitive key={index} object={createArc(start, end, color)} />;
      })}

      {/* Hover info */}
      {hoveredNode && (
        <Html position={latLngToVector3(hoveredNode.lat, hoveredNode.lng, 5.2)}>
          <div className="bg-white/90 p-2 rounded shadow-lg text-sm">
            <p className="font-bold">{hoveredNode.name}</p>
            <p>Score: {hoveredNode.ethical_score}%</p>
            <p>{hoveredNode.country}</p>
          </div>
        </Html>
      )}
    </group>
  );
};

const SupplyChainGraph = () => {
  const globeEl = useRef<Globe | null>(null);
  const controlsRef = useRef<any>(); // For OrbitControls

  // State management
  const [graphData, setGraphData] = useState<ExtendedGraphData>({
    nodes: [],
    links: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeObject | null>(null);
  const [hoverNode, setHoverNode] = useState<NodeObject | null>(null);
  const [filterEthicalScore, setFilterEthicalScore] = useState<number>(0);
  const [showEthicalPathsOnly, setShowEthicalPathsOnly] =
    useState<boolean>(false);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);

  // UI state
  const [darkMode, setDarkMode] = useState<boolean>(false); // Keep dark mode toggle
  const [filterPanelOpen, setFilterPanelOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  // Removed states related to 2D/3D view, node/link size specific to force graphs

  // Create a ref for the root container
  const containerRef = useRef<HTMLDivElement>(null);

  // New state for node expansion
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedConnection, setSelectedConnection] =
    useState<LinkObject | null>(null);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getSupplyChainGraphData();

        // Ensure nodes have lat/lng (vital for globe)
        const validNodes = data.nodes.filter(
          (n) => n.lat !== undefined && n.lng !== undefined
        ) as NodeObject[];
        if (validNodes.length !== data.nodes.length) {
          console.warn(
            `Some nodes were filtered out due to missing lat/lng coordinates. ${
              data.nodes.length - validNodes.length
            } nodes out of ${data.nodes.length} were removed.`
          );
        }

        // Process links to ensure source/target can be resolved to nodes with coords
        const nodeMap = new Map(validNodes.map((n) => [n.id, n]));
        const validLinks = data.links
          .filter((link) => {
            const sourceNode = nodeMap.get(
              typeof link.source === "string" ? link.source : link.source.id
            );
            const targetNode = nodeMap.get(
              typeof link.target === "string" ? link.target : link.target.id
            );
            return sourceNode && targetNode;
          })
          .map((link) => ({
            // Ensure source/target are IDs for globe processing
          ...link,
          source:
              typeof link.source === "string" ? link.source : link.source.id,
          target:
              typeof link.target === "string" ? link.target : link.target.id,
          })) as LinkObject[];

        setGraphData({
          nodes: validNodes,
          links: validLinks,
          isMockData: data.isMockData,
        });
        setUsingMockData(!!data.isMockData);
        console.log(
          `Using ${data.isMockData ? "mock" : "real"} supply chain data with ${
            validNodes.length
          } nodes and ${validLinks.length} links.`
        );
        setError(null);
      } catch (err) {
        console.error("Error fetching supply chain graph data:", err);
        setError("Failed to load supply chain data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered data for the globe
  const filteredGraphData = useMemo(() => {
    let nodes = graphData.nodes;
    let links = graphData.links;

    // Filter nodes by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filteredNodeIds = new Set(
        nodes
          .filter(
        (node) =>
          node.name.toLowerCase().includes(lowerSearchTerm) ||
              (node.country &&
                node.country.toLowerCase().includes(lowerSearchTerm))
          )
          .map((n) => n.id)
      );
      nodes = nodes.filter((n) => filteredNodeIds.has(n.id));
      // Filter links to only include those connecting filtered nodes
      links = links.filter(
        (l) =>
          filteredNodeIds.has(l.source as string) &&
          filteredNodeIds.has(l.target as string)
      );
    }

    // Filter nodes by ethical score
    if (filterEthicalScore > 0) {
      const filteredNodeIds = new Set(
        nodes
          .filter((node) => (node.ethical_score || 0) >= filterEthicalScore)
          .map((n) => n.id)
      );
      nodes = nodes.filter((n) => filteredNodeIds.has(n.id));
      // Filter links again
      links = links.filter(
        (l) =>
          filteredNodeIds.has(l.source as string) &&
          filteredNodeIds.has(l.target as string)
      );
    }

    // Filter links by ethical status (if requested)
    if (showEthicalPathsOnly) {
      links = links.filter((link) => link.ethical);
      // Optionally filter nodes to only include those involved in ethical links
      const ethicalNodeIds = new Set();
      links.forEach((link) => {
        ethicalNodeIds.add(link.source);
        ethicalNodeIds.add(link.target);
      });
      nodes = nodes.filter((node) => ethicalNodeIds.has(node.id));
    }

    return { nodes, links };
  }, [graphData, searchTerm, filterEthicalScore, showEthicalPathsOnly]);

  // Update globe setup effect - we'll use a more direct approach
  useEffect(() => {
    if (!containerRef.current || loading || error || !filteredGraphData) return;

    // Clear previous content
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(darkMode ? 0x111827 : 0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 250;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create globe
    const globe = new Globe()
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
      .pointsData(filteredGraphData.nodes)
      .pointAltitude(0.01)
      .pointRadius((d) => ((d.ethical_score || 50) / 100) * 0.5 + 0.1)
      .pointColor((d) =>
        (d.ethical_score || 0) > 75
          ? "rgba(0, 255, 0, 0.75)"
          : (d.ethical_score || 0) > 50
          ? "rgba(255, 165, 0, 0.75)"
          : "rgba(255, 0, 0, 0.75)"
      )
      .pointLat("lat")
      .pointLng("lng");

    // Setup point hover events
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Add mousemove event listener to detect hover over points
    renderer.domElement.addEventListener("mousemove", (event) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(globe.children, true);

      if (intersects.length > 0) {
        // Find the point data
        const pointData = filteredGraphData.nodes.find((node) => {
          // This is a simplistic approach - you might need to check position or object ID
          const pointCoords = new THREE.Vector3(
            node.lng,
            node.lat,
            0.01 // Using the pointAltitude
          );
          const distance = pointCoords.distanceTo(intersects[0].point);
          return distance < 0.1; // Some threshold for considering it a match
        });

        if (pointData) {
          setHoverNode(pointData);
        } else {
          setHoverNode(null);
        }
      } else {
        setHoverNode(null);
      }
    });

    // Add click event for selecting nodes
    renderer.domElement.addEventListener("click", (event) => {
      if (hoverNode) {
        setSelectedNode(hoverNode);
      } else {
    setSelectedNode(null);
      }
    });

    // Add arcs for links
    const arcData = filteredGraphData.links
      .map((link) => {
        const sourceCoords = getNodeCoords(
          link.source,
          filteredGraphData.nodes
        );
        const targetCoords = getNodeCoords(
          link.target,
          filteredGraphData.nodes
        );
        if (!sourceCoords || !targetCoords) return null;

        return {
          ...link,
          startLat: sourceCoords.lat,
          startLng: sourceCoords.lng,
          endLat: targetCoords.lat,
          endLng: targetCoords.lng,
        };
      })
      .filter(Boolean);

    globe
      .arcsData(arcData)
      .arcDashLength(0.3)
      .arcDashGap(0.1)
      .arcDashAnimateTime(1000)
      .arcColor((d) =>
        d.ethical ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.5)"
      )
      .arcStroke(0.3)
      .arcAltitudeAutoScale(0.3);

    // Add globe to scene
    scene.add(globe);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }

      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, [filteredGraphData, darkMode, loading, error]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => {
        alert(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
      setIsFullscreen(true);
    } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
  };

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Get connection details
  const getConnectionDetails = (link: LinkObject) => {
    const sourceNode = graphData.nodes.find((n) => n.id === link.source);
    const targetNode = graphData.nodes.find((n) => n.id === link.target);
    if (!sourceNode || !targetNode) return null;

    return {
      source: sourceNode,
      target: targetNode,
      relationship: link.relationship || "Supplier Relationship",
      ethical: link.ethical,
      riskFactors: link.risk_factors || [],
      complianceStatus: link.compliance_status || "Unknown",
    };
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-white hover:text-gray-300">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-white">
              Supply Chain Network
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-white/10"
            >
              {darkMode ? (
                <Sun className="w-6 h-6 text-white" />
              ) : (
                <Moon className="w-6 h-6 text-white" />
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/10"
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6 text-white" />
              ) : (
                <Maximize className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
                    </div>
                  </div>

      {/* Main Canvas */}
      <div className="w-full h-[60vh]">
        <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
          />
          <Earth
            nodes={filteredGraphData.nodes}
            links={filteredGraphData.links}
            onNodeHover={setHoverNode}
            onNodeClick={setSelectedNode}
          />
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            zoomSpeed={0.6}
            panSpeed={0.5}
            rotateSpeed={0.4}
          />
        </Canvas>
                  </div>

      {/* Flowchart Section */}
      <div className="w-full bg-gray-800/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex">
            {/* Network Tree */}
            <div className="w-1/2 p-4 overflow-y-auto border-r border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">
                Supplier Network
              </h2>
              <div className="space-y-2">
                {graphData.nodes.map((node) => (
                  <div key={node.id} className="bg-gray-700/50 rounded-lg p-3">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleNode(node.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {expandedNodes.has(node.id) ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-white">
                          {node.name}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            node.ethical_score > 75
                              ? "bg-green-500/20 text-green-400"
                              : node.ethical_score > 50
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {node.ethical_score}%
                        </span>
                    </div>
                      <span className="text-sm text-gray-400">
                        {node.country}
                      </span>
                </div>

                    {expandedNodes.has(node.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 pl-6 space-y-2"
                      >
                        {graphData.links
                          .filter(
                            (link) =>
                              link.source === node.id || link.target === node.id
                          )
                          .map((link) => {
                            const isSource = link.source === node.id;
                            const connectedNode = graphData.nodes.find(
                              (n) =>
                                n.id === (isSource ? link.target : link.source)
                            );
                            if (!connectedNode) return null;

                            return (
                              <div
                                key={`${link.source}-${link.target}`}
                                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-600/50 cursor-pointer"
                                onClick={() => setSelectedConnection(link)}
                              >
                                <LinkIcon
                                  className={`w-4 h-4 ${
                                    link.ethical
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                />
                                <span className="text-sm text-gray-300">
                                  {isSource ? "Supplies to" : "Supplied by"}{" "}
                                  {connectedNode.name}
                                </span>
                  </div>
                            );
                          })}
            </motion.div>
          )}
            </div>
                ))}
              </div>
              </div>

            {/* Connection Details */}
            <div className="w-1/2 p-4 overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-4">
                Connection Details
              </h2>
              {selectedConnection ? (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  {(() => {
                    const details = getConnectionDetails(selectedConnection);
                    if (!details) return null;

                    return (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-white">
                              {details.source.name} → {details.target.name}
                            </h3>
                            {details.ethical ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                            )}
              </div>
                          <span className="text-sm text-gray-400">
                            {details.relationship}
                </span>
              </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">
                              Compliance Status
                            </h4>
                            <div
                              className={`px-3 py-2 rounded ${
                                details.complianceStatus === "Compliant"
                                  ? "bg-green-500/20 text-green-400"
                                  : details.complianceStatus === "Non-Compliant"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {details.complianceStatus}
              </div>
              </div>

                          {details.riskFactors.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-2">
                                Risk Factors
                              </h4>
                              <div className="space-y-2">
                                {details.riskFactors.map((factor, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2"
                                  >
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                    <span className="text-sm text-gray-300">
                                      {factor}
                                    </span>
            </div>
                                ))}
            </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                      <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-2">
                                Source Supplier
                              </h4>
                              <div className="bg-gray-600/50 rounded p-3">
                                <p className="text-white font-medium">
                                  {details.source.name}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {details.source.country}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Score: {details.source.ethical_score}%
                                </p>
                      </div>
                    </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-2">
                                Target Supplier
                              </h4>
                              <div className="bg-gray-600/50 rounded p-3">
                                <p className="text-white font-medium">
                                  {details.target.name}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {details.target.country}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Score: {details.target.ethical_score}%
                                </p>
                                    </div>
                                    </div>
                            </div>
                          </div>
                </>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <Info className="w-12 h-12 mx-auto mb-2" />
                    <p>Select a connection to view details</p>
                </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainGraph;
