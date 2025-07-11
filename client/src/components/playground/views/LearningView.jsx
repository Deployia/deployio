import { useState } from "react";
import LearningPanel from "../LearningPanel";
import { LearningSidebar } from "../sidebars";

const LearningView = ({ selectedRepo }) => {
  // Learning-specific state
  const [workspace, setWorkspace] = useState({
    learningProgress: {
      "docker-fundamentals": {
        completed: 85,
        modules: ["Images", "Containers", "Volumes", "Networks"],
      },
      "cicd-pipelines": {
        completed: 60,
        modules: ["GitHub Actions", "Jenkins", "GitLab CI"],
      },
      "kubernetes-basics": {
        completed: 30,
        modules: ["Pods", "Services", "Deployments", "Ingress"],
      },
      "infrastructure-as-code": {
        completed: 0,
        modules: ["Terraform", "AWS CDK", "Pulumi"],
      },
    },
    currentModule: null,
    bookmarks: [],
  });

  // Get sidebar content
  const getSidebarContent = () => ({
    title: "Learning Progress",
    content: <LearningSidebar workspace={workspace} />,
  });

  return {
    workspace,
    setWorkspace,
    getSidebarContent,
    renderContent: () => (
      <div className="h-full overflow-auto">
        <LearningPanel
          workspace={workspace}
          setWorkspace={setWorkspace}
          selectedRepo={selectedRepo}
        />
      </div>
    ),
  };
};

export default LearningView;
