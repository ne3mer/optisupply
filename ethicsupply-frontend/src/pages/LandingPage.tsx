import React, {
  Suspense,
  useEffect,
  useState,
  Component,
  ErrorInfo,
} from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  Brain,
  Zap,
  Globe as GlobeIcon,
  BarChart3,
  Leaf,
  Shield,
  Network,
  TrendingUp,
  ArrowRight,
  Github,
  Linkedin,
  Mail,
  ChevronRight,
} from "lucide-react";

// 3D Globe Component
const InteractiveGlobe = () => {
  const earthRef = React.useRef<THREE.Mesh>(null!);

  // Use a simple shader material instead of texture maps
  const customShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      uniform float time;
      
      vec3 oceanColor = vec3(0.09, 0.35, 0.73);
      vec3 landColor = vec3(0.2, 0.6, 0.3);
      vec3 cloudColor = vec3(1.0, 1.0, 1.0);
      
      // Simplex noise function to create a procedural Earth-like texture
      // Based on https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
      
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      void main() {
        // Create continents with noise
        float continentShape = snoise(vUv * 5.0) * 0.5 + 0.5;
        continentShape = smoothstep(0.4, 0.6, continentShape);
        
        // Add some smaller detail noise
        float detailNoise = snoise(vUv * 15.0 + time * 0.05) * 0.3 + 0.7;
        
        // Mix ocean and land colors based on the noise patterns
        vec3 baseColor = mix(oceanColor, landColor, continentShape);
        
        // Simple atmosphere glow effect based on the normal
        float atmosphere = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
        vec3 glowColor = vec3(0.3, 0.6, 1.0);
        
        // Add a subtle cloud layer
        float clouds = smoothstep(0.4, 0.6, snoise(vUv * 8.0 + vec2(time * 0.01, 0.0)));
        baseColor = mix(baseColor, cloudColor, clouds * 0.3);
        
        // Combine everything
        vec3 finalColor = baseColor + glowColor * atmosphere * 0.4;
        
        // Lighting effect based on normals
        float light = dot(vNormal, normalize(vec3(1.0, 0.5, 0.2))) * 0.5 + 0.5;
        finalColor *= light;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });

  useFrame(({ clock }) => {
    if (earthRef.current) {
      // Slow rotation
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.1;
      // Update shader time uniform
      customShaderMaterial.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={earthRef} scale={2.5} receiveShadow castShadow>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={customShaderMaterial} attach="material" />
    </mesh>
  );
};

// Feature Card Component
const FeatureCard = ({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700/50"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg mb-4 shadow-md">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </motion.div>
  );
};

// Add an error boundary component to catch WebGL errors
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("3D Globe rendering failed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Fallback component for when 3D rendering fails
const GlobeFallback = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-800 to-blue-900 opacity-30 dark:opacity-50" />
);

const LandingPage = () => {
  const features = [
    {
      icon: <Brain size={24} />,
      title: "AI-Powered Analysis",
      description:
        "Leverage advanced AI for deep ethical insights and supply chain optimization.",
      delay: 0.1,
    },
    {
      icon: <Shield size={24} />,
      title: "Comprehensive ESG Scoring",
      description:
        "Evaluate suppliers rigorously across environmental, social, and governance factors.",
      delay: 0.2,
    },
    {
      icon: <GlobeIcon size={24} />,
      title: "Global Risk Mapping",
      description:
        "Visualize and mitigate geopolitical, environmental, and compliance risks.",
      delay: 0.3,
    },
    {
      icon: <Network size={24} />,
      title: "Supply Chain Visualization",
      description:
        "Understand complex relationships with interactive network graphs.",
      delay: 0.4,
    },
    {
      icon: <TrendingUp size={24} />,
      title: "Actionable Recommendations",
      description:
        "Receive concrete, AI-driven suggestions for improving supplier ethics.",
      delay: 0.5,
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Performance Analytics",
      description:
        "Track progress, benchmark suppliers, and report on ethical performance.",
      delay: 0.6,
    },
  ];

  return (
    <div className="relative bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">
      {/* Hero Section with 3D Globe */}
      <section className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-50 dark:opacity-30">
          <ErrorBoundary fallback={<GlobeFallback />}>
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
              <Suspense fallback={null}>
                <Stars
                  radius={100}
                  depth={50}
                  count={5000}
                  factor={4}
                  saturation={0}
                  fade
                  speed={1}
                />
                <InteractiveGlobe />
              </Suspense>
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
              />
            </Canvas>
          </ErrorBoundary>
      </div>

          <motion.div
          className="relative z-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
            Build Resilient & Ethical Supply Chains
            </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8">
            OptiEthic empowers businesses with AI-driven insights to proactively
            manage ESG risks, enhance transparency, and ensure compliance across
            their global supply network.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            Explore Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          </motion.div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Ethical Intelligence for Modern Supply Chains
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Go beyond basic compliance. OptiEthic provides the tools and
            insights needed to build truly sustainable and responsible supplier
            networks, mitigating risks and enhancing brand reputation.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Core Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={feature.delay}
              />
            ))}
              </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Optimize Your Supply Chain?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Gain unparalleled visibility and control over your supply chain's
            ethical performance. Start making data-driven decisions today.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center px-8 py-3 bg-white text-emerald-700 font-semibold rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            Get Started Now
            <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
            </div>
      </section>

      {/* Footer Section */}
      <footer className="py-12 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="text-center md:text-left">
            <Link
              to="/"
              className="inline-block font-bold text-lg text-gray-800 dark:text-white mb-2"
            >
              OptiEthic
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} OptiEthic. All rights reserved.
            </p>
      </div>

          <div className="text-center"></div>

          <div className="flex justify-center md:justify-end space-x-4">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Github size={20} />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="mailto:info@optiethic.com"
              className="text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Mail size={20} />
            </a>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
