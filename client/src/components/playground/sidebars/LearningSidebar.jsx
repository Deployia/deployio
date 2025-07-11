import { FaBookOpen, FaCode } from "react-icons/fa";

const LearningSidebar = ({ workspace, onModuleSelect }) => {
  // Get learning progress from workspace or use defaults
  const learningProgress = workspace?.learningProgress || {};

  const modules = [
    {
      id: "docker-fundamentals",
      title: "Docker Fundamentals",
      color: "blue",
      description: "Containerization basics and best practices",
    },
    {
      id: "cicd-pipelines",
      title: "CI/CD Pipelines",
      color: "green",
      description: "Continuous integration and deployment",
    },
    {
      id: "kubernetes-basics",
      title: "Kubernetes Basics",
      color: "purple",
      description: "Container orchestration with K8s",
    },
    {
      id: "infrastructure-as-code",
      title: "Infrastructure as Code",
      color: "orange",
      description: "Terraform and CloudFormation",
    },
  ];

  return (
    <div className="p-4 space-y-4 custom-scrollbar">
      <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body">
        Learning Progress
      </div>
      <div className="space-y-3">
        {modules.map((module) => {
          const progress = learningProgress[module.id]?.completed || 0;
          const moduleTopics = learningProgress[module.id]?.modules || [];

          return (
            <div
              key={module.id}
              onClick={() => onModuleSelect && onModuleSelect(module.id)}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 hover:border-neutral-700/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white heading">
                  {module.title}
                </span>
                <span className="text-xs text-neutral-400 body">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full bg-${module.color}-500 transition-all`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-neutral-300 body mb-2 leading-relaxed">
                {module.description}
              </div>
              {moduleTopics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {moduleTopics.map((topic, topicIndex) => (
                    <span
                      key={topicIndex}
                      className={`px-2 py-1 bg-${module.color}-500/20 text-${module.color}-400 border border-${module.color}-500/30 rounded text-xs body`}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Learning Resources */}
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
        <div className="text-sm font-semibold text-white heading mb-3">
          Quick Resources
        </div>
        <div className="space-y-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs body">
            <FaBookOpen className="w-3 h-3" />
            Documentation
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors text-xs body">
            <FaCode className="w-3 h-3" />
            Practice Lab
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningSidebar;
