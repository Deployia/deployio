import { useState } from "react";
import AIAnalysisPanel from "../AIAnalysisPanel";
import { AnalysisSidebar } from "../sidebars";

const AnalysisView = ({ selectedRepo, githubToken }) => {
  // Analysis-specific state
  const [workspace, setWorkspace] = useState({
    analysisData: null,
    activeFile: null,
    analysisHistory: [],
    settings: {
      securityAnalysis: true,
      performanceCheck: true,
      bestPractices: true,
      codeQuality: true,
    },
  });

  // Get sidebar content
  const getSidebarContent = () => ({
    title: "Analysis Tools",
    content: <AnalysisSidebar workspace={workspace} />,
  });

  return {
    workspace,
    setWorkspace,
    getSidebarContent,
    renderContent: () => (
      <div className="h-full overflow-auto">
        <AIAnalysisPanel
          workspace={workspace}
          setWorkspace={setWorkspace}
          selectedRepo={selectedRepo}
          githubToken={githubToken}
        />
      </div>
    ),
  };
};

export default AnalysisView;
