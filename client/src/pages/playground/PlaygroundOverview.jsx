import SEO from "@components/SEO";
import { motion } from "framer-motion";
import {
  FaBrain,
  FaCode,
  FaBookOpen,
  FaComments,
  FaRocket,
} from "react-icons/fa";

const features = [
  {
    icon: FaCode,
    title: "IDE Editor",
    description:
      "Edit, explore, and experiment with code in a modern online IDE.",
  },
  {
    icon: FaBrain,
    title: "AI Code Analysis",
    description:
      "Get instant AI-powered code analysis, best practice suggestions, and DevOps insights.",
  },
  {
    icon: FaRocket,
    title: "Code Generation",
    description:
      "Generate code, CI/CD pipelines, and infrastructure templates using AI.",
  },
  {
    icon: FaBookOpen,
    title: "Learning Modules",
    description:
      "Learn DevOps, CI/CD, Docker, Kubernetes, and more with interactive modules.",
  },
  {
    icon: FaComments,
    title: "DevOps Chatbot",
    description:
      "Chat with DeployBot, your DevOps AI assistant for instant answers and best practices.",
  },
];

const PlaygroundOverview = () => (
  <>
    <SEO page="playground" />
    <div className="h-full flex flex-col items-center justify-center bg-neutral-900 text-white p-8">
      <div className="max-w-2xl w-full mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4 heading">
          Deployio Playground Overview
        </h1>
        <p className="text-lg text-neutral-300 mb-8 body">
          Welcome to the Deployio Playground! Experiment with DevOps best
          practices, AI-powered code analysis, code generation, and interactive
          learning modules—all in one place.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="flex flex-col items-center bg-neutral-800/70 rounded-xl p-6 shadow-lg"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-8 h-8 mb-3 text-blue-400" />
                <h3 className="text-xl font-semibold mb-2 heading">
                  {feature.title}
                </h3>
                <p className="text-neutral-300 body">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="text-neutral-400 text-sm">
          Use the sidebar to explore each feature or start with the IDE Editor.
        </div>
      </div>
    </div>
  </>
);

export default PlaygroundOverview;
