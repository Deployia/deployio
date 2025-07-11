import { Routes, Route } from "react-router-dom";
import PlaygroundLayout from "./PlaygroundLayout";
import PlaygroundOverview from "./PlaygroundOverview";

const PlaygroundRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PlaygroundLayout />}>
        <Route index element={<PlaygroundOverview />} />
        <Route path="editor" element={<div />} />
        <Route path="analysis" element={<div />} />
        <Route path="generation" element={<div />} />
        <Route path="learning" element={<div />} />
        <Route path="chatbot" element={<div />} />
        {/* All playground functionality is handled within PlaygroundLayout */}
        {/* Individual routes serve as navigation targets only */}
      </Route>
    </Routes>
  );
};

export default PlaygroundRoutes;
