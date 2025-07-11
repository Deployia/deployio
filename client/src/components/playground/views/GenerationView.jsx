import { useState } from "react";
import GenerationPanel from "../GenerationPanel";
import { GenerationSidebar } from "../sidebars";

const GenerationView = ({ selectedRepo }) => {
  // Generation-specific state
  const [workspace, setWorkspace] = useState({
    templates: {
      dockerfile: [],
      cicdPipeline: [],
      kubernetesConfig: [],
      terraformConfig: [],
    },
    activeTemplate: null,
    generatedCode: null,
    settings: {
      language: "javascript",
      framework: "express",
      includeTests: true,
      includeComments: true,
    },
    history: [],
  });

  // Get sidebar content
  const getSidebarContent = () => ({
    title: "Code Generation",
    content: (
      <GenerationSidebar workspace={workspace} setWorkspace={setWorkspace} />
    ),
  });

  return {
    workspace,
    setWorkspace,
    getSidebarContent,
    renderContent: () => (
      <div className="h-full overflow-auto">
        <GenerationPanel
          workspace={workspace}
          setWorkspace={setWorkspace}
          selectedRepo={selectedRepo}
        />
      </div>
    ),
  };
};

export default GenerationView;
