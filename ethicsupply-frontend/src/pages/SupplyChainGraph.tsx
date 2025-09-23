import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSupplyChainGraphData,
  GraphNode,
  GraphLink,
  GraphData,
} from "../services/api";
import {
  Network,
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
  ExternalLink,
  Plus,
  CheckSquare,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Position,
  MarkerType,
  useReactFlow,
  Handle,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { ReactFlowProvider } from "reactflow";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import Globe from "react-globe.gl";
import { useTheme } from "../contexts/ThemeContext";
import logger from "../utils/log";

// --- Define default edgeTypes OUTSIDE component ---
// We are not using custom edges, but defining this might help silence the warning
const defaultEdgeTypes = {}; // Or import default types if needed

// --- Supplier List Theme Colors ---
const lightColors = {
  background: "#0D0F1A",
  panel: "rgba(25, 28, 43, 0.8)",
  panelSolid: "#191C2B",
  primary: "#00F0FF", // Teal
  secondary: "#FF00FF", // Magenta
  accent: "#4D5BFF", // Blue
  text: "#E0E0FF",
  textMuted: "#8A94C8",
  success: "#00FF8F", // Green
  warning: "#FFD700", // Yellow
  error: "#FF4D4D", // Red
  inputBg: "rgba(40, 44, 66, 0.9)",
};

const darkColors = {
  background: "#1a1a1a",
  panel: "#2d2d2d",
  panelSolid: "#2d2d2d",
  primary: "#3b82f6",
  secondary: "#6b7280",
  accent: "#8b5cf6",
  text: "#ffffff",
  textMuted: "#9ca3af",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  inputBg: "#2d2d2d",
};

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

// --- Dagre Layout Helper ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 50; // Adjust based on custom node size

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

// --- Custom Node Component ---
const CustomNode = React.memo(({ data, colors }) => {
  const { label, apiData } = data;
  const score = apiData?.ethical_score ?? 50; // Default if score missing
  const nodeColor =
    score >= 75 ? colors.success : score >= 50 ? colors.warning : colors.error;
  const nodeBgColor =
    score >= 75
      ? colors.success + "10"
      : score >= 50
      ? colors.warning + "10"
      : colors.error + "10";

  return (
    <>
      {/* Add Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: colors.accent }}
      />
      <div
        className="react-flow__node-default"
        style={{
          background: nodeBgColor,
          color: colors.text,
          border: `2px solid ${nodeColor}`,
          borderRadius: "6px",
          padding: "10px 15px",
          fontSize: "13px",
          textAlign: "center",
          minWidth: nodeWidth - 30, // Account for padding
          maxWidth: nodeWidth - 30,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: colors.accent }}
      />
    </>
  );
});

CustomNode.displayName = "CustomNode";

// --- Define nodeTypes OUTSIDE the main component ---
const createNodeTypes = (colors) => ({
  customNode: (props) => <CustomNode {...props} colors={colors} />,
});

const SupplyChainGraph = () => {
  const globeEl = useRef<Globe | null>(null);
  const controlsRef = useRef<any>(); // For OrbitControls
  const { darkMode } = useTheme();
  const colors = darkMode ? darkColors : lightColors;
  const defaultColors = {
    background: darkMode ? "#1a1a1a" : "#ffffff",
    text: darkMode ? "#ffffff" : "#000000",
    panel: darkMode ? "#2d2d2d" : "#ffffff",
    panelSolid: darkMode ? "#2d2d2d" : "#ffffff",
    primary: darkMode ? "#3b82f6" : "#2563eb",
    secondary: darkMode ? "#6b7280" : "#4b5563",
    accent: darkMode ? "#8b5cf6" : "#7c3aed",
    textMuted: darkMode ? "#9ca3af" : "#6b7280",
    success: darkMode ? "#10b981" : "#059669",
    warning: darkMode ? "#f59e0b" : "#d97706",
    error: darkMode ? "#ef4444" : "#dc2626",
    inputBg: darkMode ? "#2d2d2d" : "#f3f4f6",
  };

  // Memoize nodeTypes to prevent recreation on every render
  const nodeTypes = useMemo(() => createNodeTypes(colors), [colors]);

  // State management
  const [graphData, setGraphData] = useState<ExtendedGraphData>({
    nodes: [],
    links: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeApiData, setSelectedNodeApiData] =
    useState<NodeObject | null>(null);
  const [filterEthicalScore, setFilterEthicalScore] = useState<number>(0);
  const [showEthicalPathsOnly, setShowEthicalPathsOnly] =
    useState<boolean>(false);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // UI state
  const [filterPanelOpen, setFilterPanelOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>("TB");

  // Create a ref for the root container
  const containerRef = useRef<HTMLDivElement>(null);

  // New state for node expansion
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedConnection, setSelectedConnection] =
    useState<LinkObject | null>(null);

  // React Flow state
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // Add these new state variables inside the SupplyChainGraph component near other state variables:
  const [isCreatingConnection, setIsCreatingConnection] =
    useState<boolean>(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [connectionTarget, setConnectionTarget] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<string>("supplier");
  const [connectionEthical, setConnectionEthical] = useState<boolean>(true);

  // --- Persistence helpers for user-created links ---
  const USER_LINKS_KEY = "supplyChain:userLinks";
  const loadUserLinks = (): LinkObject[] => {
    try {
      const raw = localStorage.getItem(USER_LINKS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as LinkObject[];
    } catch (e) {
      logger.warn("Failed to load user links", e);
      return [];
    }
  };
  const saveUserLinks = (links: LinkObject[]) => {
    try {
      localStorage.setItem(USER_LINKS_KEY, JSON.stringify(links));
    } catch (e) {
      logger.warn("Failed to save user links", e);
    }
  };

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setUsingMockData(false);
        const data = await getSupplyChainGraphData();

        // Add basic lat/lng fallback if missing (replace with better logic if possible)
        const nodesWithCoords = data.nodes.map((n, i) => ({
          ...n,
          lat: n.lat ?? Math.random() * 180 - 90, // Random fallback lat
          lng: n.lng ?? Math.random() * 360 - 180, // Random fallback lng
          ethical_score: n.ethical_score ?? Math.floor(Math.random() * 100),
        })) as NodeObject[];

        // Validate links (ensure source/target exist in nodesWithCoords)
        const validLinks = data.links.filter((link) => {
          const sourceExists = nodesWithCoords.some(
            (n) => n.id === link.source
          );
          const targetExists = nodesWithCoords.some(
            (n) => n.id === link.target
          );
          if (!sourceExists || !targetExists) {
            console.warn(
              `Link removed due to missing node: ${link.source} -> ${link.target}`
            );
          }
          return sourceExists && targetExists;
        }) as LinkObject[];

        // Merge user-saved links
        const userLinks = loadUserLinks().filter((l) => {
          const s = typeof l.source === 'string' ? l.source : l.source.id;
          const t = typeof l.target === 'string' ? l.target : l.target.id;
          const sourceExists = nodesWithCoords.some((n) => n.id === s);
          const targetExists = nodesWithCoords.some((n) => n.id === t);
          return sourceExists && targetExists;
        });
        // Deduplicate by source-target pair
        const seen = new Set(validLinks.map(l => `${l.source}->${l.target}`));
        const mergedLinks: LinkObject[] = [...validLinks];
        userLinks.forEach(l => {
          const s = typeof l.source === 'string' ? l.source : l.source.id;
          const t = typeof l.target === 'string' ? l.target : l.target.id;
          const key = `${s}->${t}`;
          if (!seen.has(key)) {
            seen.add(key);
            mergedLinks.push({ ...l, source: s, target: t });
          }
        });

        setGraphData({
          nodes: nodesWithCoords,
          links: mergedLinks,
          isMockData: data.isMockData ?? false, // Handle potential mock flag
        });
        setUsingMockData(data.isMockData ?? false);
      } catch (err) {
        console.error("Error fetching graph data:", err);
        setError("Failed to load supply chain data.");
        setUsingMockData(true); // Assume mock on error for display
        setGraphData({ nodes: [], links: [], isMockData: true }); // Set empty data
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtered data for the globe
  const filteredGraphData = useMemo(() => {
    let filteredNodes = graphData.nodes;
    let filteredLinks = graphData.links;

    // Filter nodes by ethical score
    if (filterEthicalScore > 0) {
      filteredNodes = filteredNodes.filter(
        (node) => (node.ethical_score ?? 0) >= filterEthicalScore
      );
    }

    // Filter nodes by search term
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filteredNodes = filteredNodes.filter(
        (node) =>
          node.name.toLowerCase().includes(query) ||
          node.country?.toLowerCase().includes(query) ||
          node.industry?.toLowerCase().includes(query)
      );
    }

    // Get IDs of filtered nodes
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

    // Filter links based on filtered nodes and ethical path flag
    filteredLinks = filteredLinks.filter((link) => {
      // Correctly get source/target IDs
      const sourceId =
        typeof link.source === "string" ? link.source : link.source.id;
      const targetId =
        typeof link.target === "string" ? link.target : link.target.id;

      const sourceVisible = filteredNodeIds.has(sourceId);
      const targetVisible = filteredNodeIds.has(targetId);
      const ethicalMatch = !showEthicalPathsOnly || link.ethical;
      return sourceVisible && targetVisible && ethicalMatch;
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, filterEthicalScore, showEthicalPathsOnly, searchTerm]);

  // Transform API data & Apply Layout
  useEffect(() => {
    // Add check for empty data early
    if (
      !filteredGraphData ||
      !filteredGraphData.nodes ||
      !filteredGraphData.links
    ) {
      console.log(
        "[SupplyChainGraph] Filtered graph data is missing nodes or links."
      );
      setRfNodes([]);
      setRfEdges([]);
      return;
    }

    console.log(
      "[SupplyChainGraph] Filtered Nodes for Layout:",
      filteredGraphData.nodes.length,
      filteredGraphData.nodes
    );
    console.log(
      "[SupplyChainGraph] Filtered Links for Layout:",
      filteredGraphData.links.length,
      filteredGraphData.links
    );

    // Create initial nodes for layout calculation
    const initialNodes: Node[] = filteredGraphData.nodes.map((node) => ({
      id: node.id,
      position: { x: 0, y: 0 }, // Dagre will calculate this
      data: { label: node.name, apiData: node },
      type: "customNode", // Use our custom node
    }));

    const initialEdges: Edge[] = filteredGraphData.links.map((link) => ({
      id: `e-${
        typeof link.source === "string" ? link.source : link.source.id
      }-${typeof link.target === "string" ? link.target : link.target.id}`,
      source: typeof link.source === "string" ? link.source : link.source.id,
      target: typeof link.target === "string" ? link.target : link.target.id,
      type: "default", // Change from 'smoothstep' to 'default' for better arrow visibility
      animated: !link.ethical,
      style: {
        stroke: link.ethical ? colors.success : colors.error,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: link.ethical ? colors.success : colors.error,
        width: 25, // Increased size for better visibility
        height: 25, // Increased size for better visibility
      },
      data: { apiData: link },
    }));

    console.log(
      "[SupplyChainGraph] Generated Initial Edges for React Flow:",
      initialEdges.length,
      initialEdges
    );

    // Calculate layout
    // Add check for empty nodes *before* layout
    if (initialNodes.length === 0) {
      console.log("[SupplyChainGraph] No nodes to layout.");
      setRfNodes([]);
      setRfEdges([]); // Ensure edges are cleared if nodes are empty
      return;
    }

    try {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(
          initialNodes,
          initialEdges,
          layoutDirection // Layout direction: Top-to-Bottom ('LR' for Left-to-Right)
        );

      console.log("[SupplyChainGraph] Layouted Nodes:", layoutedNodes.length);
      console.log(
        "[SupplyChainGraph] Layouted Edges:",
        layoutedEdges.length,
        layoutedEdges
      ); // Log after layout

      setRfNodes(layoutedNodes);
      setRfEdges(layoutedEdges); // Use layoutedEdges which Dagre might modify (though usually not)

      // Adjust view after layout
      setTimeout(() => {
        // Check if fitView is available before calling
        if (fitView) {
          fitView({ padding: 0.2 });
        } else {
          console.warn(
            "[SupplyChainGraph] fitView function not available from useReactFlow."
          );
        }
      }, 50); // Increased delay slightly
    } catch (layoutError) {
      console.error(
        "[SupplyChainGraph] Error during Dagre layout:",
        layoutError
      );
      // Fallback: Set nodes without layout if Dagre fails
      setRfNodes(
        initialNodes.map((n) => ({
          ...n,
          position: { x: Math.random() * 400, y: Math.random() * 400 },
        }))
      ); // Random positions
      setRfEdges(initialEdges);
      setError("Failed to calculate graph layout.");
    }
  }, [filteredGraphData, setRfNodes, setRfEdges, fitView, colors, layoutDirection]); // include layoutDirection

  // Neighbor highlighting when a node is selected
  useEffect(() => {
    if (!selectedNodeApiData) {
      // reset opacity
      setRfNodes((nodes) => nodes.map((n) => ({ ...n, style: { ...(n.style || {}), opacity: 1 } })));
      setRfEdges((edges) => edges.map((e) => ({ ...e, style: { ...(e.style || {}), opacity: 1 } })));
      return;
    }

    const selectedId = selectedNodeApiData.id;
    const neighborIds = new Set<string>();
    filteredGraphData.links.forEach((l) => {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
      if (s === selectedId) neighborIds.add(t);
      if (t === selectedId) neighborIds.add(s);
    });

    setRfNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        style: {
          ...(n.style || {}),
          opacity: n.id === selectedId || neighborIds.has(n.id) ? 1 : 0.25,
        },
      }))
    );
    setRfEdges((edges) =>
      edges.map((e) => {
        const isConnected = e.source === selectedId || e.target === selectedId || neighborIds.has(e.source) || neighborIds.has(e.target);
        return { ...e, style: { ...(e.style || {}), opacity: isConnected ? 1 : 0.2 } };
      })
    );
  }, [selectedNodeApiData, filteredGraphData.links, setRfNodes, setRfEdges]);

  // Start connection creation mode
  const startConnectionCreation = () => {
    setIsCreatingConnection(true);
    setConnectionSource(null);
    setConnectionTarget(null);
  };

  // Cancel connection creation
  const cancelConnectionCreation = () => {
    setIsCreatingConnection(false);
    setConnectionSource(null);
    setConnectionTarget(null);
  };

  // Create new connection
  const createConnection = () => {
    if (!connectionSource || !connectionTarget) {
      alert("Please select both source and target suppliers");
      return;
    }

    // Create new connection
    const newLink: LinkObject = {
      id: `e-${connectionSource}-${connectionTarget}-${Date.now()}`,
      source: connectionSource,
      target: connectionTarget,
      relationship: connectionType,
      ethical: connectionEthical,
    };

    // Add to graph data
    setGraphData((prev) => ({
      ...prev,
      links: [...prev.links, newLink],
    }));

    // Persist to localStorage
    const current = loadUserLinks();
    saveUserLinks([...current, newLink]);

    // Reset connection creation state
    setIsCreatingConnection(false);
    setConnectionSource(null);
    setConnectionTarget(null);

    // Alert user
    alert("Connection created successfully!");
  };

  // Handle node selection during connection creation
  const handleNodeSelectionForConnection = (nodeId: string) => {
    if (!connectionSource) {
      setConnectionSource(nodeId);
    } else if (nodeId !== connectionSource) {
      setConnectionTarget(nodeId);
    }
  };

  // Handle node click in React Flow
  const onNodeClick = useCallback(
    (event, node: Node) => {
      logger.log("Node clicked:", node);

      // If in connection creation mode, handle node selection
      if (isCreatingConnection) {
        handleNodeSelectionForConnection(node.id);
        return;
      }

      // Otherwise proceed with normal behavior
      setSelectedNodeApiData(node.data.apiData);
      setSelectedConnection(null);
    },
    [
      setSelectedNodeApiData,
      setSelectedConnection,
      isCreatingConnection,
      handleNodeSelectionForConnection,
    ]
  );

  // Handle edge click in React Flow
  const onEdgeClick = useCallback(
    (event, edge: Edge) => {
      logger.log("Edge clicked:", edge);
      setSelectedConnection(edge.data.apiData); // Update panel with API data
      setSelectedNodeApiData(null); // Clear node selection
    },
    [setSelectedConnection, setSelectedNodeApiData]
  );

  // Toggle node expansion
  const toggleNode = useCallback(
    (nodeId: string) => {
      setExpandedNodes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
        } else {
          newSet.add(nodeId);
        }
        return newSet;
      });
      // Also select in the detail panel
      setSelectedNodeApiData(
        graphData.nodes.find((n) => n.id === nodeId) || null
      );
      setSelectedConnection(null);
    },
    [graphData.nodes, setSelectedNodeApiData, setSelectedConnection]
  );

  // Get connection details
  const getConnectionDetails = useCallback(
    (link: LinkObject) => {
      setSelectedConnection(link);
      setSelectedNodeApiData(
        graphData.nodes.find(
          (n) =>
            n.id ===
            (typeof link.source === "string" ? link.source : link.source.id)
        ) || null
      );
    },
    [graphData.nodes, setSelectedConnection, setSelectedNodeApiData]
  );

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

  // --- Fetch Data Listener (Remains the same) ---
  useEffect(() => {
    const handleFetch = () => {
      console.log("Simulating data refresh...");
      setLoading(true);
      setTimeout(() => {
        setGraphData({ nodes: [], links: [], isMockData: true });
        setUsingMockData(true);
        setLoading(false);
      }, 500);
    };
    window.addEventListener("fetchData", handleFetch);
    return () => window.removeEventListener("fetchData", handleFetch);
  }, []);

  const Earth = () => {
    // ... globe setup ...

    return (
      <Canvas style={{ background: colors.background }}>
        <ambientLight intensity={1.5} /> {/* Increased intensity */}
        <directionalLight position={[5, 5, 5]} intensity={2.0} />{" "}
        {/* Increased intensity */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
        />
        {/* The actual Globe component */}
        <mesh>
          {/* Use a slightly lighter, bluer material */}
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhongMaterial
            color={new THREE.Color(colors.accent).multiplyScalar(0.6)} // Lighter base color
            specular={new THREE.Color(0x111111)} // Reduced specular highlights
            shininess={5} // Reduced shininess
            transparent
            opacity={0.9}
          />
        </mesh>
        {/* Orbit Controls - If you re-enable, ensure it's INSIDE Canvas */}
        {/* <OrbitControls ref={controlsRef} enablePan={true} enableZoom={true} enableRotate={true} minDistance={1.5} maxDistance={5} target={[0, 0, 0]} /> */}
        {/* Add points or other globe elements here, passing filteredGraphData */}
      </Canvas>
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 gap-6"
      style={{
        backgroundColor: colors?.background || defaultColors.background,
        color: colors?.text || defaultColors.text,
      }}
    >
      {/* Header (Optional - Assuming Navbar is external) */}
      {/* <Header /> */}

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Supply Chain{" "}
            <span style={{ color: colors.primary }}>Flowchart</span>
          </h1>
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={startConnectionCreation}
              className="p-2 rounded border hover:bg-gray-700/50 transition"
              title="Create Connection"
              style={{
                backgroundColor: colors.panel,
                borderColor: colors.accent + "50",
                color: colors.primary,
              }}
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setLayoutDirection((d) => (d === 'TB' ? 'LR' : 'TB'))}
              className="px-2 py-1 rounded border text-xs"
              title="Toggle Layout Direction"
              style={{
                backgroundColor: colors.panel,
                borderColor: colors.accent + '50',
                color: colors.text,
              }}
            >
              {layoutDirection === 'TB' ? 'Top-Bottom' : 'Left-Right'}
            </button>
            <button
              onClick={() => {
                try { fitView && fitView({ padding: 0.2 }); } catch {}
              }}
              className="px-2 py-1 rounded border text-xs"
              title="Fit to View"
              style={{
                backgroundColor: colors.panel,
                borderColor: colors.accent + '50',
                color: colors.text,
              }}
            >
              Fit
            </button>
            <button
              onClick={() => {
                /* Add refresh logic */
              }}
              className="p-2 rounded border border-gray-600 hover:bg-gray-700/50 transition"
              title="Refresh Data"
              style={{ color: colors.textMuted }}
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => {
                if (!containerRef.current) return;
                if (!document.fullscreenElement) {
                  containerRef.current.requestFullscreen?.();
                  setIsFullscreen(true);
                } else {
                  document.exitFullscreen?.();
                  setIsFullscreen(false);
                }
              }}
              className="p-2 rounded border hover:bg-gray-700/50 transition"
              title="Toggle Fullscreen"
              style={{
                backgroundColor: colors.panel,
                borderColor: colors.accent + '50',
                color: colors.text,
              }}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            {/* Add other controls like fullscreen toggle */}
          </div>
        </div>
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {(() => {
            const nodeCount = filteredGraphData.nodes.length;
            const linkCount = filteredGraphData.links.length;
            const ethicalLinks = filteredGraphData.links.filter((l) => l.ethical).length;
            const ethicalPct = linkCount ? Math.round((ethicalLinks / linkCount) * 100) : 0;
            const avgScore = nodeCount
              ? (
                  filteredGraphData.nodes.reduce((sum, n) => sum + (n.ethical_score ?? 0), 0) /
                  nodeCount
                ).toFixed(1)
              : '0.0';
            const kpiBox = (label: string, value: string, color: string) => (
              <div className="p-3 rounded border text-center" style={{ borderColor: color + '40', backgroundColor: color + '10' }}>
                <div className="text-xs" style={{ color: colors.textMuted }}>{label}</div>
                <div className="text-xl font-bold" style={{ color: colors.text }}>{value}</div>
              </div>
            );
            return (
              <>
                {kpiBox('Suppliers', String(nodeCount), colors.accent)}
                {kpiBox('Connections', String(linkCount), colors.primary)}
                {kpiBox('Ethical Paths', `${ethicalPct}%`, colors.success)}
                {kpiBox('Avg. Score', `${avgScore}`, colors.warning)}
              </>
            );
          })()}
        </div>
        {error && (
          <div
            className="mb-4 p-3 rounded border flex items-center gap-2"
            style={{
              backgroundColor: colors.error + "20",
              borderColor: colors.error + "80",
              color: colors.error,
            }}
          >
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        {usingMockData && !error && (
          <div
            className="mb-4 p-3 rounded border flex items-center gap-2"
            style={{
              backgroundColor: colors.warning + "20",
              borderColor: colors.warning + "80",
              color: colors.warning,
            }}
          >
            <Info size={18} /> Displaying Mock Data.
          </div>
        )}
      </motion.div>

      {/* === Visualization Section (REACT FLOW) === */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-[60vh] rounded-lg overflow-hidden border"
        style={{
          borderColor: colors.accent + "30",
          backgroundColor: colors.panelSolid,
        }}
      >
        {/* container for fullscreen */}
        <div ref={containerRef} className="w-full h-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader
              className="h-12 w-12 animate-spin"
              style={{ color: colors.primary }}
            />
          </div>
        ) : (
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            edgeTypes={defaultEdgeTypes}
            defaultEdgeOptions={{
              type: "default",
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            attributionPosition="bottom-left"
            className="dark-flow"
          >
            <Controls
              style={{
                button: {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  border: `1px solid ${colors.accent}50`,
                },
              }}
            />
            <Background
              color={colors.accent}
              gap={16}
              style={{ backgroundColor: colors.background }}
            />
          </ReactFlow>
        )}
        </div>
      </motion.div>

      {/* Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded border" style={{ borderColor: colors.accent + '30', backgroundColor: colors.panel }}>
          <div className="text-sm font-medium mb-2" style={{ color: colors.text }}>Legend</div>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: colors.textMuted }}>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-1 inline-block" style={{ backgroundColor: colors.success }} /> Ethical connection
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-1 inline-block" style={{ backgroundColor: colors.error }} /> Risky connection
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: colors.success + '40', border: `1px solid ${colors.success}` }} /> High score node
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: colors.warning + '40', border: `1px solid ${colors.warning}` }} /> Medium score node
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: colors.error + '40', border: `1px solid ${colors.error}` }} /> Low score node
            </span>
          </div>
        </div>
        <div className="p-3 rounded border" style={{ borderColor: colors.accent + '30', backgroundColor: colors.panel }}>
          <div className="text-sm font-medium mb-2" style={{ color: colors.text }}>Tips</div>
          <ul className="text-xs list-disc pl-5" style={{ color: colors.textMuted }}>
            <li>Click a node to focus and dim unrelated nodes.</li>
            <li>Use the layout toggle to switch between top-to-bottom and left-to-right.</li>
            <li>Adjust the minimum score or enable Ethical Only to filter paths.</li>
            <li>Use Fit to refocus after filtering or panning.</li>
          </ul>
        </div>
      </div>

      {/* === Flow Details Section (Left/Right Panels remain) === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-grow rounded-lg p-4 md:p-6 border"
        style={{
          backgroundColor: colors.panel,
          borderColor: colors.accent + "30",
        }}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Network style={{ color: colors.primary }} />
          Flow Details
        </h2>

        <div
          className="flex flex-col lg:flex-row gap-6"
          style={{ minHeight: "40vh" }}
        >
          {/* === Left Panel: Filter/Search/Tree (Remains the same, drives filtering) === */}
          <div
            className="lg:w-1/3 border-r pr-6 overflow-y-auto custom-scrollbar"
            style={{ borderColor: colors.accent + "30", maxHeight: "50vh" }}
          >
            {/* Search Input */}
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: colors.textMuted }}
              />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-opacity-50"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.accent + "50",
                  color: colors.text,
                  ringColor: colors.primary,
                }}
              />
            </div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEthicalPathsOnly(!showEthicalPathsOnly)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition`}
                style={{
                  color: showEthicalPathsOnly
                    ? colors.success
                    : colors.textMuted,
                  borderColor: showEthicalPathsOnly
                    ? colors.success + "80"
                    : colors.accent + "50",
                  backgroundColor: showEthicalPathsOnly
                    ? colors.success + "15"
                    : "transparent",
                }}
              >
                {showEthicalPathsOnly ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
                Ethical Only
              </motion.button>
              <div
                className="flex items-center gap-2 flex-grow min-w-[150px]"
                style={{ color: colors.textMuted }}
              >
                <SlidersHorizontal size={14} />
                <label
                  htmlFor="scoreFilter"
                  className="whitespace-nowrap text-xs"
                >
                  Min Score:
                </label>
                <input
                  type="range"
                  id="scoreFilter"
                  min="0"
                  max="100"
                  value={filterEthicalScore}
                  onChange={(e) =>
                    setFilterEthicalScore(Number(e.target.value))
                  }
                  className="w-full h-1 rounded-lg appearance-none cursor-pointer range-sm accent-primary bg-gray-700"
                  style={{ accentColor: colors.primary }}
                />
                <span className="text-xs w-6 text-right font-mono">
                  {filterEthicalScore}
                </span>
              </div>
            </div>

            {/* Tree List (Now maybe less essential, but keep for alternative view?) */}
            <h3
              className="text-sm font-semibold mb-2 uppercase"
              style={{ color: colors.textMuted }}
            >
              Filtered Suppliers
            </h3>
            <AnimatePresence>
              {loading ? (
                <div
                  className="text-center py-4"
                  style={{ color: colors.textMuted }}
                >
                  Loading nodes...
                </div>
              ) : filteredGraphData.nodes.length === 0 ? (
                <p
                  className="text-center py-4"
                  style={{ color: colors.textMuted }}
                >
                  No suppliers match filters.
                </p>
              ) : (
                filteredGraphData.nodes.map((node) => (
                  <motion.div
                    key={node.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-1.5"
                  >
                    <div
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition hover:bg-gray-700/30`}
                      style={{
                        backgroundColor:
                          selectedNodeApiData?.id === node.id
                            ? colors.accent + "20"
                            : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full`}
                          style={{
                            backgroundColor:
                              node.ethical_score >= 75
                                ? colors.success
                                : node.ethical_score >= 50
                                ? colors.warning
                                : colors.error,
                          }}
                        ></span>
                        <span
                          className="font-medium"
                          style={{ color: colors.text }}
                        >
                          {node.name}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: colors.textMuted }}
                        >
                          ({node.country})
                        </span>
                      </div>
                      {graphData.links.some((l) => l.source === node.id) && (
                        <motion.div
                          animate={{
                            rotate: expandedNodes.has(node.id) ? 0 : -90,
                          }}
                        >
                          <ChevronRight
                            size={16}
                            style={{ color: colors.textMuted }}
                          />
                        </motion.div>
                      )}
                    </div>
                    <AnimatePresence>
                      {expandedNodes.has(node.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-4 mt-1 space-y-1 border-l border-gray-700 ml-3"
                        >
                          {filteredGraphData.links
                            .filter((link) => link.source === node.id)
                            .map((link) => {
                              const targetNode = graphData.nodes.find(
                                (n) => n.id === link.target
                              );
                              // Only show if target node also passes filters
                              if (
                                !filteredGraphData.nodes.some(
                                  (n) => n.id === link.target
                                )
                              )
                                return null;

                              return (
                                <div
                                  key={`${link.source}-${link.target}`}
                                  className={`flex items-center justify-between p-1.5 rounded text-sm cursor-pointer transition ${
                                    selectedConnection?.source ===
                                      link.source &&
                                    selectedConnection?.target === link.target
                                      ? "bg-blue-900/30"
                                      : "hover:bg-gray-700/30"
                                  }`}
                                  onClick={() => getConnectionDetails(link)}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <LinkIcon
                                      size={12}
                                      style={{
                                        color: link.ethical
                                          ? colors.success
                                          : colors.error,
                                      }}
                                    />
                                    <span style={{ color: colors.textMuted }}>
                                      {targetNode?.name || "Unknown"}
                                    </span>
                                  </div>
                                  <ChevronRight
                                    size={14}
                                    style={{ color: colors.textMuted }}
                                  />
                                </div>
                              );
                            })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* === Right Panel: Connection/Node Details (Driven by Flowchart/Tree clicks) === */}
          <div
            className="lg:w-2/3 overflow-y-auto custom-scrollbar"
            style={{ maxHeight: "50vh" }}
          >
            <AnimatePresence mode="wait">
              {selectedConnection ? (
                <motion.div
                  key={
                    selectedConnection.source + "-" + selectedConnection.target
                  }
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded border"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.accent + "50",
                  }}
                >
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: colors.primary }}
                  >
                    Connection Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong style={{ color: colors.textMuted }}>From:</strong>
                      <span style={{ color: colors.accent }}>
                        {" "}
                        {graphData.nodes.find(
                          (n) => n.id === selectedConnection.source
                        )?.name || "Unknown"}
                      </span>
                    </p>
                    <p>
                      <strong style={{ color: colors.textMuted }}>To:</strong>
                      <span style={{ color: colors.accent }}>
                        {" "}
                        {graphData.nodes.find(
                          (n) => n.id === selectedConnection.target
                        )?.name || "Unknown"}
                      </span>
                    </p>
                    <p>
                      <strong style={{ color: colors.textMuted }}>
                        Relationship:
                      </strong>{" "}
                      {selectedConnection.relationship || "N/A"}
                    </p>
                    <p className="flex items-center gap-1">
                      <strong style={{ color: colors.textMuted }}>
                        Ethical Status:
                      </strong>
                      {selectedConnection.ethical ? (
                        <span
                          className="flex items-center gap-1"
                          style={{ color: colors.success }}
                        >
                          <CheckCircle size={14} /> Compliant
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1"
                          style={{ color: colors.error }}
                        >
                          <AlertTriangle size={14} /> Potential Risk
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      className="text-xs underline"
                      style={{ color: colors.textMuted }}
                      onClick={() => setSelectedConnection(null)}
                    >
                      Close
                    </button>
                    <button
                      className="px-2 py-1 rounded text-xs border"
                      style={{ color: colors.error, borderColor: colors.error + '60', backgroundColor: colors.error + '15' }}
                      onClick={() => {
                        // remove from graphData and storage
                        setGraphData((prev) => ({
                          ...prev,
                          links: prev.links.filter((l) => !(l.source === selectedConnection.source && l.target === selectedConnection.target)),
                        }));
                        try {
                          const key = "supplyChain:userLinks";
                          const raw = localStorage.getItem(key);
                          const arr = raw ? JSON.parse(raw) : [];
                          const filtered = Array.isArray(arr) ? arr.filter((l:any) => !(l.source === selectedConnection.source && l.target === selectedConnection.target)) : [];
                          localStorage.setItem(key, JSON.stringify(filtered));
                        } catch {}
                        setSelectedConnection(null);
                      }}
                    >
                      Delete Connection
                    </button>
                  </div>
                </motion.div>
              ) : selectedNodeApiData ? (
                <motion.div
                  key={selectedNodeApiData.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded border"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.accent + "50",
                  }}
                >
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: colors.primary }}
                  >
                    {selectedNodeApiData.name}
                  </h3>
                  <p>
                    <strong style={{ color: colors.textMuted }}>
                      Country:
                    </strong>{" "}
                    {selectedNodeApiData.country || "N/A"}
                  </p>
                  <p>
                    <strong style={{ color: colors.textMuted }}>
                      Industry:
                    </strong>{" "}
                    {selectedNodeApiData.industry || "N/A"}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <strong style={{ color: colors.textMuted }}>
                      Ethical Score:
                    </strong>
                    <span
                      className={`font-medium px-2 py-0.5 rounded text-xs border`}
                      style={{
                        color:
                          selectedNodeApiData.ethical_score >= 75
                            ? colors.success
                            : selectedNodeApiData.ethical_score >= 50
                            ? colors.warning
                            : colors.error,
                        backgroundColor:
                          selectedNodeApiData.ethical_score >= 75
                            ? colors.success + "15"
                            : selectedNodeApiData.ethical_score >= 50
                            ? colors.warning + "15"
                            : colors.error + "15",
                        borderColor:
                          selectedNodeApiData.ethical_score >= 75
                            ? colors.success + "50"
                            : selectedNodeApiData.ethical_score >= 50
                            ? colors.warning + "50"
                            : colors.error + "50",
                      }}
                    >
                      {selectedNodeApiData.ethical_score?.toFixed(1) ?? "N/A"}%
                    </span>
                  </p>
                  <Link
                    to={`/suppliers/${selectedNodeApiData.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
                    style={{ color: colors.accent }}
                  >
                    View Full Supplier Details <ExternalLink size={14} />
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center justify-center h-full"
                  style={{ color: colors.textMuted }}
                >
                  <p>
                    Select a supplier node or connection line in the flowchart.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Connection Creator Panel */}
      {isCreatingConnection && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 right-8 z-10 p-4 rounded-lg shadow-lg border"
          style={{
            backgroundColor: colors.panel,
            borderColor: colors.accent + "50",
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold" style={{ color: colors.primary }}>
              Create New Connection
            </h3>
            <button
              onClick={cancelConnectionCreation}
              className="p-1 rounded hover:bg-black/20"
            >
              <X size={16} style={{ color: colors.textMuted }} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label
                className="block text-sm mb-1"
                style={{ color: colors.textMuted }}
              >
                Source Supplier:
              </label>
              <div
                className="p-2 rounded border text-sm"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.accent + "30",
                  color: connectionSource ? colors.text : colors.textMuted,
                }}
              >
                {connectionSource
                  ? graphData.nodes.find((n) => n.id === connectionSource)
                      ?.name || connectionSource
                  : "Click a supplier on the graph to select"}
              </div>
            </div>

            <div>
              <label
                className="block text-sm mb-1"
                style={{ color: colors.textMuted }}
              >
                Target Supplier:
              </label>
              <div
                className="p-2 rounded border text-sm"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.accent + "30",
                  color: connectionTarget ? colors.text : colors.textMuted,
                }}
              >
                {connectionTarget
                  ? graphData.nodes.find((n) => n.id === connectionTarget)
                      ?.name || connectionTarget
                  : "Click another supplier on the graph to select"}
              </div>
            </div>

            <div>
              <label
                className="block text-sm mb-1"
                style={{ color: colors.textMuted }}
              >
                Relationship Type:
              </label>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value)}
                className="w-full p-2 rounded border text-sm"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.accent + "30",
                  color: colors.text,
                }}
              >
                <option value="supplier">Supplier</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
                <option value="partner">Partner</option>
                <option value="subsidiary">Subsidiary</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ethical-connection"
                checked={connectionEthical}
                onChange={(e) => setConnectionEthical(e.target.checked)}
                className="rounded"
                style={{ accentColor: colors.success }}
              />
              <label
                htmlFor="ethical-connection"
                className="text-sm cursor-pointer"
                style={{ color: colors.text }}
              >
                Ethical Connection
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={cancelConnectionCreation}
                className="px-3 py-1.5 rounded text-sm"
                style={{
                  backgroundColor: "transparent",
                  color: colors.textMuted,
                }}
              >
                Cancel
              </button>
              <button
                onClick={createConnection}
                disabled={!connectionSource || !connectionTarget}
                className="px-3 py-1.5 rounded text-sm flex items-center gap-1.5"
                style={{
                  backgroundColor:
                    connectionSource && connectionTarget
                      ? colors.primary
                      : colors.primary + "50",
                  color:
                    connectionSource && connectionTarget
                      ? colors.background
                      : colors.background + "80",
                }}
              >
                <CheckSquare size={14} />
                Create Connection
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Styling (Remove jsx and global props) */}
      <style>{`
        /* Custom React Flow styles */
        .react-flow__node { /* Example: Use styles defined in node object */ }
        .react-flow__edge path { /* Example: Use styles defined in edge object */ }
        .react-flow__attribution { display: none; } /* Hide attribution for cleaner look */

        /* Scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: ${colors.accent}50;
          border-radius: 10px;
          border: 1px solid transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: ${colors.accent}80;
        }

        /* Range input styles */
        input[type='range'].range-sm {
          height: 4px;
        }
        input[type='range']::-webkit-slider-thumb {
          width: 12px;
          height: 12px;
          background: ${colors.primary};
          border-radius: 50%;
          cursor: pointer;
          -webkit-appearance: none;
          margin-top: -4px;
        }
        input[type='range']::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: ${colors.primary};
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        input[type='range']::-ms-thumb {
          width: 12px;
          height: 12px;
          background: ${colors.primary};
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        input[type='range']::-webkit-slider-runnable-track {
          background: ${colors.inputBg};
          height: 4px;
          border-radius: 2px;
        }
        input[type='range']::-moz-range-track {
          background: ${colors.inputBg};
          height: 4px;
          border-radius: 2px;
        }
        input[type='range']::-ms-track {
          background: transparent;
          border-color: transparent;
          color: transparent;
          height: 4px;
          width: 100%;
        }
        input[type='range']::-ms-fill-lower {
          background: ${colors.primary};
          border-radius: 2px;
        }
        input[type='range']::-ms-fill-upper {
          background: ${colors.inputBg};
          border-radius: 2px;
        }

        /* React Flow node styles are now mostly handled by CustomNode */
        .react-flow__node.selected > div {
           box-shadow: 0 0 0 2px ${colors.primary};
        }
        .react-flow__edge.selected path {
           stroke: ${colors.primary};
        }
      `}</style>
    </div>
  );
};

const SupplyChainGraphWithProvider = () => (
  <ReactFlowProvider>
    <SupplyChainGraph />
  </ReactFlowProvider>
);

export default SupplyChainGraphWithProvider;
