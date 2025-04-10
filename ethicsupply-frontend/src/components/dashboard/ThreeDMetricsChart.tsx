import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  useHelper,
  Environment,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";
import { Vector3 } from "three";

// Color constants
const colors = {
  primary: "#6E56CF",
  secondary: "#1C7ED6",
  accent: "#00CFFD",
  success: "#4ADE80",
  warning: "#FBA94F",
  error: "#F87171",
  textPrimary: "#E0E0FF",
  grid: "#192136",
};

interface ThreeDMetricsChartProps {
  scores: Record<string, number>;
  compliance: Record<string, number>;
  trends: Record<string, number>;
  height?: number;
}

// Individual data point in 3D space
const DataPoint: React.FC<{
  position: [number, number, number];
  color: string;
  size: number;
}> = ({ position, color, size }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh position={position} ref={meshRef}>
      <icosahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color={color}
        metalness={0.5}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

// Connecting lines between data points
const ConnectionLines = ({ points }) => {
  const linesMaterial = new THREE.LineBasicMaterial({
    color: colors.grid,
    transparent: true,
    opacity: 0.4,
  });

  const linesGeometry = new THREE.BufferGeometry().setFromPoints(
    points.flatMap((point, i) => {
      const connections = [];
      // Connect to the next 2 points in a semi-circular pattern
      for (let j = 1; j <= 2; j++) {
        const nextIndex = (i + j) % points.length;
        connections.push(new Vector3().fromArray(point));
        connections.push(new Vector3().fromArray(points[nextIndex]));
      }
      return connections;
    })
  );

  return <lineSegments geometry={linesGeometry} material={linesMaterial} />;
};

// Grid helper component
const GridHelper = () => {
  return (
    <gridHelper
      args={[20, 20, colors.grid, colors.grid]}
      position={[0, -3, 0]}
      rotation={[0, 0, 0]}
    />
  );
};

// Animated camera orbit
const AnimatedCamera = () => {
  const cameraRef = useRef();

  useFrame(({ clock }) => {
    if (cameraRef.current) {
      const t = clock.getElapsedTime() * 0.2;
      const radius = 15;
      const height = Math.sin(t * 0.2) * 2;

      cameraRef.current.position.x = Math.sin(t) * radius;
      cameraRef.current.position.z = Math.cos(t) * radius;
      cameraRef.current.position.y = height + 5;

      cameraRef.current.lookAt(0, 0, 0);
    }
  });

  return <perspectiveCamera ref={cameraRef} position={[0, 5, 15]} fov={60} />;
};

// Scene with data visualization
interface DataVisualizationProps {
  scores: Record<string, number>;
  compliance: Record<string, number>;
  trends: Record<string, number>;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  scores,
  compliance,
  trends,
}) => {
  const dataPoints = useMemo(() => {
    const points = [];
    const radius = 3;
    let index = 0;

    // Process scores
    Object.entries(scores).forEach(([key, value], i) => {
      const angle = (i / Object.keys(scores).length) * Math.PI * 2;
      points.push({
        position: [Math.cos(angle) * radius, 1, Math.sin(angle) * radius] as [
          number,
          number,
          number
        ],
        color: colors.primary,
        size: (value / 100) * 0.8,
        label: key,
      });
    });

    // Process compliance
    Object.entries(compliance).forEach(([key, value], i) => {
      const angle = (i / Object.keys(compliance).length) * Math.PI * 2;
      points.push({
        position: [
          Math.cos(angle) * (radius - 1),
          0,
          Math.sin(angle) * (radius - 1),
        ] as [number, number, number],
        color: colors.success,
        size: (value / 100) * 0.8,
        label: key,
      });
    });

    // Process trends
    Object.entries(trends).forEach(([key, value], i) => {
      const angle = (i / Object.keys(trends).length) * Math.PI * 2;
      points.push({
        position: [
          Math.cos(angle) * (radius - 2),
          -1,
          Math.sin(angle) * (radius - 2),
        ] as [number, number, number],
        color: colors.accent,
        size: (value / 100) * 0.8,
        label: key,
      });
    });

    return points;
  }, [scores, compliance, trends]);

  return (
    <>
      {dataPoints.map((point, index) => (
        <group key={index}>
          <DataPoint
            position={point.position}
            color={point.color}
            size={point.size}
          />
          <Text
            position={[
              point.position[0],
              point.position[1] + 0.5,
              point.position[2],
            ]}
            fontSize={0.3}
            color={colors.textPrimary}
            anchorX="center"
            anchorY="middle"
          >
            {point.label}
          </Text>
        </group>
      ))}
      <ConnectionLines points={dataPoints.map((p) => p.position)} />
      <GridHelper />
    </>
  );
};

// Main component
const ThreeDMetricsChart: React.FC<ThreeDMetricsChartProps> = ({
  scores,
  compliance,
  trends,
  height = 300,
}) => {
  return (
    <Canvas
      camera={{ position: [5, 5, 5], fov: 50 }}
      style={{ background: "transparent", height: `${height}px` }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <DataVisualization
        scores={scores}
        compliance={compliance}
        trends={trends}
      />
      <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      <Environment preset="city" />
    </Canvas>
  );
};

export default ThreeDMetricsChart;
