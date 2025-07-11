import { Routes, Route, Navigate } from "react-router-dom";
import PlaygroundLayout from "./PlaygroundLayout";

// Playground route components
const PlaygroundEditor = () => (
  <div className="p-4 text-white">Code Editor Active</div>
);
const PlaygroundAnalysis = () => (
  <div className="p-4 text-white">AI Analysis Active</div>
);
const PlaygroundGeneration = () => (
  <div className="p-4 text-white">AI Generation Active</div>
);
const PlaygroundLearning = () => (
  <div className="p-4 text-white">Learning Modules Active</div>
);
const PlaygroundChatbot = () => (
  <div className="p-4 text-white">AI Assistant Active</div>
);
const PlaygroundMonitoring = () => (
  <div className="p-4 text-white">Monitoring Dashboard Active</div>
);

const PlaygroundRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PlaygroundLayout />}>
        <Route index element={<Navigate to="/playground/editor" replace />} />
        <Route path="editor" element={<PlaygroundEditor />} />
        <Route path="analysis" element={<PlaygroundAnalysis />} />
        <Route path="generation" element={<PlaygroundGeneration />} />
        <Route path="learning" element={<PlaygroundLearning />} />
        <Route path="chatbot" element={<PlaygroundChatbot />} />
        <Route path="monitoring" element={<PlaygroundMonitoring />} />
      </Route>
    </Routes>
  );
};

export default PlaygroundRoutes;
