import AuthGuard from "./AuthGuard";
import {
  FaCode,
  FaBrain,
  FaRocket,
  FaChartLine,
  FaLaptopCode,
} from "react-icons/fa";

/**
 * PlaygroundAuthGuard - Specialized AuthGuard for the playground page
 */
const PlaygroundAuthGuard = ({ children }) => {
  const playgroundFeatures = [
    { icon: FaCode, label: "Code Editor", color: "text-blue-400" },
    { icon: FaBrain, label: "AI Analysis", color: "text-purple-400" },
    { icon: FaRocket, label: "Code Generation", color: "text-green-400" },
    { icon: FaChartLine, label: "AI Copilot", color: "text-orange-400" },
  ];

  return (
    <AuthGuard
      title="Welcome to Deployio Playground"
      subtitle="Sign in to start coding, analyzing, and deploying your projects with AI-powered assistance"
      features={playgroundFeatures}
      showBackButton={true}
      backPath="/"
      allowClose={false}
      context="playground"
      icon={FaLaptopCode}
    >
      {children}
    </AuthGuard>
  );
};

export default PlaygroundAuthGuard;
