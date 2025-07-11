import { Routes, Route, Navigate } from "react-router-dom";
import PlaygroundLayout from "./PlaygroundLayout";

const PlaygroundRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PlaygroundLayout />}>
        <Route index element={<Navigate to="/playground/editor" replace />} />
        <Route path="editor" element={<div />} />
        <Route path="analysis" element={<div />} />
        <Route path="generation" element={<div />} />
        <Route path="learning" element={<div />} />
        <Route path="chatbot" element={<div />} />
      </Route>
    </Routes>
  );
};

export default PlaygroundRoutes;
