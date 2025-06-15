import { useEffect, useRef } from "react";

/**
 * Neural Network Background Component
 * Renders an animated neural network background with customizable parameters
 *
 * @param {string} className - Additional CSS classes
 * @param {number} nodeCount - Number of nodes in the network (default: 50)
 * @param {number} connectionDistance - Maximum distance for node connections (default: 150)
 * @param {number} animationSpeed - Speed of node movement (default: 0.5)
 * @param {string} nodeColor - RGBA color for nodes (default: "rgba(59, 130, 246, 0.6)")
 * @param {string} connectionColor - RGBA color for connections (default: "rgba(59, 130, 246, 0.2)")
 * @param {boolean} enableGlow - Enable glow effect on nodes (default: true)
 * @param {boolean} perspective3D - Enable 3D perspective effect (default: true)
 * @param {boolean} backgroundGradient - Enable subtle background gradient (default: true)
 */
const NeuralNetworkBackground = ({
  className = "",
  nodeCount = 50,
  connectionDistance = 150,
  animationSpeed = 0.5,
  nodeColor = "rgba(59, 130, 246, 0.6)",
  connectionColor = "rgba(59, 130, 246, 0.2)",
  enableGlow = true,
  perspective3D = true,
  backgroundGradient = true,
}) => {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width, height;

    const resizeCanvas = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const createNodes = () => {
      nodesRef.current = [];
      for (let i = 0; i < nodeCount; i++) {
        nodesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 500, // 3D depth
          vx: (Math.random() - 0.5) * animationSpeed,
          vy: (Math.random() - 0.5) * animationSpeed,
          vz: (Math.random() - 0.5) * animationSpeed * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.3,
        });
      }
    };

    const updateNodes = () => {
      nodesRef.current.forEach((node) => {
        // Update positions
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // Bounce off edges
        if (node.x <= 0 || node.x >= width) node.vx *= -1;
        if (node.y <= 0 || node.y >= height) node.vy *= -1;
        if (node.z <= 0 || node.z >= 500) node.vz *= -1;

        // Keep within bounds
        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));
        node.z = Math.max(0, Math.min(500, node.z));

        // Subtle opacity animation
        node.opacity += (Math.random() - 0.5) * 0.01;
        node.opacity = Math.max(0.1, Math.min(0.8, node.opacity));
      });
    };
    const drawNodes = () => {
      nodesRef.current.forEach((node) => {
        let projectedX = node.x;
        let projectedY = node.y;
        let projectedSize = node.size;

        // Apply 3D perspective effect if enabled
        if (perspective3D) {
          const perspective = 300;
          const scale = perspective / (perspective + node.z);
          projectedX = node.x * scale;
          projectedY = node.y * scale;
          projectedSize = node.size * scale;
        }

        ctx.beginPath();
        ctx.arc(projectedX, projectedY, projectedSize, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor.replace("0.6", node.opacity.toString());
        ctx.fill();

        // Add glow effect if enabled
        if (enableGlow) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = nodeColor;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    };
    const drawConnections = () => {
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const nodeA = nodesRef.current[i];
          const nodeB = nodesRef.current[j];

          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dz = nodeA.z - nodeB.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < connectionDistance) {
            let projectedAX = nodeA.x;
            let projectedAY = nodeA.y;
            let projectedBX = nodeB.x;
            let projectedBY = nodeB.y;

            // Apply 3D perspective for connections if enabled
            if (perspective3D) {
              const perspective = 300;
              const scaleA = perspective / (perspective + nodeA.z);
              const scaleB = perspective / (perspective + nodeB.z);

              projectedAX = nodeA.x * scaleA;
              projectedAY = nodeA.y * scaleA;
              projectedBX = nodeB.x * scaleB;
              projectedBY = nodeB.y * scaleB;
            }

            const opacity = (1 - distance / connectionDistance) * 0.4;

            ctx.beginPath();
            ctx.moveTo(projectedAX, projectedAY);
            ctx.lineTo(projectedBX, projectedBY);
            ctx.strokeStyle = connectionColor.replace(
              "0.2",
              opacity.toString()
            );
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      updateNodes();
      drawConnections();
      drawNodes();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const init = () => {
      resizeCanvas();
      createNodes();
      animate();
    };

    // Initialize
    init();

    // Handle resize
    const handleResize = () => {
      resizeCanvas();
      createNodes();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [
    nodeCount,
    connectionDistance,
    animationSpeed,
    nodeColor,
    connectionColor,
    enableGlow,
    perspective3D,
    backgroundGradient,
  ]); // Inline styles for the component
  const containerStyle = {
    perspective: perspective3D ? "1000px" : "none",
    transformStyle: perspective3D ? "preserve-3d" : "flat",
  };

  const backgroundStyle = backgroundGradient
    ? {
        background:
          "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)",
      }
    : {};

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        ...containerStyle,
        ...backgroundStyle,
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default NeuralNetworkBackground;
