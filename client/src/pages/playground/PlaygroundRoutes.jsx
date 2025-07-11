import { Routes, Route, Navigate } from "react-router-dom";
import PlaygroundLayout from "./PlaygroundLayout";

// Playground route components - These are handled by PlaygroundLayout now
const PlaygroundEditor = () => null;
const PlaygroundAnalysis = () => null;
const PlaygroundGeneration = () => null;
const PlaygroundLearning = () => null;
const PlaygroundChatbot = () => null;

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
      </Route>
    </Routes>
  );
};

export default PlaygroundRoutes;
