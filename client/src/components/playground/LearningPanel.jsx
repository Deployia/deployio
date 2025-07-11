import { useState, useEffect } from "react";
import SEO from "@components/SEO";
import { motion } from "framer-motion";
import {
  FiBookOpen,
  FiPlay,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiCode,
  FiShield,
  FiSettings,
} from "react-icons/fi";

const LearningPanel = ({ workspace, setWorkspace: _setWorkspace }) => {
  // Get active module from workspace or default to first module
  const [activeModule, setActiveModule] = useState(
    workspace?.currentModule || "docker-fundamentals"
  );

  // Update active module when workspace changes
  useEffect(() => {
    if (workspace?.currentModule && workspace.currentModule !== activeModule) {
      setActiveModule(workspace.currentModule);
    }
  }, [workspace?.currentModule, activeModule]);

  // Learning modules data - now comes from workspace
  const learningModules = [
    {
      id: "docker-fundamentals",
      title: "Docker Fundamentals",
      description: "Master containerization with Docker",
      icon: FiCode,
      color: "blue",
      progress:
        workspace?.learningProgress?.["docker-fundamentals"]?.completed || 0,
      totalLessons: 8,
      completedLessons: Math.floor(
        ((workspace?.learningProgress?.["docker-fundamentals"]?.completed ||
          0) *
          8) /
          100
      ),
      estimatedTime: "4 hours",
      difficulty: "Beginner",
      modules:
        workspace?.learningProgress?.["docker-fundamentals"]?.modules || [],
      lessons: [
        {
          id: "docker-1",
          title: "Introduction to Containers",
          duration: "15 min",
          type: "video",
          completed: true,
          description: "Understanding containers vs virtual machines",
        },
        {
          id: "docker-2",
          title: "Docker Installation & Setup",
          duration: "20 min",
          type: "hands-on",
          completed: true,
          description: "Installing Docker on different platforms",
        },
        {
          id: "docker-3",
          title: "Your First Container",
          duration: "25 min",
          type: "tutorial",
          completed: false,
          description: "Running your first Docker container",
        },
        {
          id: "docker-4",
          title: "Writing Dockerfiles",
          duration: "30 min",
          type: "hands-on",
          completed: false,
          description: "Creating custom Docker images",
        },
        {
          id: "docker-5",
          title: "Docker Compose Basics",
          duration: "35 min",
          type: "tutorial",
          completed: false,
          description: "Multi-container applications",
        },
      ],
    },
    {
      id: "cicd-pipelines",
      title: "CI/CD Pipelines",
      description: "Automate your development workflow",
      icon: FiTrendingUp,
      color: "green",
      progress: workspace?.learningProgress?.["cicd-pipelines"]?.completed || 0,
      totalLessons: 6,
      completedLessons: Math.floor(
        ((workspace?.learningProgress?.["cicd-pipelines"]?.completed || 0) *
          6) /
          100
      ),
      estimatedTime: "3 hours",
      difficulty: "Intermediate",
      modules: workspace?.learningProgress?.["cicd-pipelines"]?.modules || [],
      lessons: [
        {
          id: "cicd-1",
          title: "CI/CD Concepts",
          duration: "20 min",
          type: "video",
          completed: true,
          description: "Understanding continuous integration and deployment",
        },
        {
          id: "cicd-2",
          title: "GitHub Actions Setup",
          duration: "30 min",
          type: "hands-on",
          completed: true,
          description: "Setting up your first GitHub Action",
        },
        {
          id: "cicd-3",
          title: "Building Test Pipelines",
          duration: "40 min",
          type: "tutorial",
          completed: false,
          description: "Automated testing in CI/CD",
        },
      ],
    },
    {
      id: "kubernetes-basics",
      title: "Kubernetes Basics",
      description: "Container orchestration at scale",
      icon: FiSettings,
      color: "purple",
      progress:
        workspace?.learningProgress?.["kubernetes-basics"]?.completed || 0,
      totalLessons: 10,
      completedLessons: Math.floor(
        ((workspace?.learningProgress?.["kubernetes-basics"]?.completed || 0) *
          10) /
          100
      ),
      estimatedTime: "6 hours",
      difficulty: "Advanced",
      modules:
        workspace?.learningProgress?.["kubernetes-basics"]?.modules || [],
      lessons: [
        {
          id: "k8s-1",
          title: "Kubernetes Overview",
          duration: "25 min",
          type: "video",
          completed: false,
          description: "Introduction to Kubernetes architecture",
        },
        {
          id: "k8s-2",
          title: "Pods and Deployments",
          duration: "35 min",
          type: "hands-on",
          completed: false,
          description: "Working with basic Kubernetes resources",
        },
      ],
    },
    {
      id: "infrastructure-as-code",
      title: "Infrastructure as Code",
      description: "Secure your DevOps pipeline",
      icon: FiShield,
      color: "orange",
      progress:
        workspace?.learningProgress?.["infrastructure-as-code"]?.completed || 0,
      totalLessons: 7,
      completedLessons: Math.floor(
        ((workspace?.learningProgress?.["infrastructure-as-code"]?.completed ||
          0) *
          7) /
          100
      ),
      estimatedTime: "5 hours",
      difficulty: "Intermediate",
      modules:
        workspace?.learningProgress?.["infrastructure-as-code"]?.modules || [],
      lessons: [
        {
          id: "sec-1",
          title: "Security Fundamentals",
          duration: "30 min",
          type: "video",
          completed: false,
          description: "DevSecOps principles and practices",
        },
      ],
    },
  ];

  const currentModuleData = learningModules.find((m) => m.id === activeModule);

  const startLesson = (lesson) => {
    // Simulate lesson start
    console.log("Starting lesson:", lesson.title);
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case "video":
        return "🎥";
      case "hands-on":
        return "💻";
      case "tutorial":
        return "📖";
      default:
        return "📚";
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "text-green-400";
      case "Intermediate":
        return "text-yellow-400";
      case "Advanced":
        return "text-red-400";
      default:
        return "text-neutral-400";
    }
  };

  return (
    <>
      <SEO page="playground-learning" />
      <div className="h-full flex flex-col bg-neutral-900">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800/50 bg-gradient-to-r from-neutral-900/50 to-neutral-800/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FiBookOpen className="w-6 h-6 text-green-400" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white heading">
                    DevOps Learning Center
                  </h2>
                  <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-md text-xs font-medium text-yellow-400 body">
                    Coming Soon
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-xs font-medium text-blue-400 body">
                    Static Preview
                  </span>
                </div>
                <p className="text-neutral-400 body">
                  Master DevOps skills with hands-on tutorials and interactive
                  lessons
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-medium body">
                🚀 Coming Soon
              </span>
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-medium body">
                Static Preview
              </span>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiAward className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white heading">
                  Completed Modules
                </span>
              </div>
              <div className="text-2xl font-bold text-white heading">1/4</div>
            </div>

            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiClock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white heading">
                  Total Hours
                </span>
              </div>
              <div className="text-2xl font-bold text-white heading">18h</div>
            </div>

            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiUsers className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white heading">
                  Community Rank
                </span>
              </div>
              <div className="text-2xl font-bold text-white heading">#47</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Module Content */}
          <div className="flex-1 overflow-auto custom-scrollbar p-6">
            {currentModuleData && (
              <div>
                {/* Module Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <currentModuleData.icon
                      className={`w-8 h-8 text-${currentModuleData.color}-400`}
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-white heading">
                        {currentModuleData.title}
                      </h2>
                      <p className="text-neutral-400 body">
                        {currentModuleData.description}
                      </p>
                    </div>
                  </div>

                  {/* Module Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-white heading">
                        {currentModuleData.totalLessons}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Total Lessons
                      </div>
                    </div>
                    <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-white heading">
                        {currentModuleData.estimatedTime}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Estimated Time
                      </div>
                    </div>
                    <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 text-center">
                      <div
                        className={`text-lg font-bold heading ${getDifficultyColor(
                          currentModuleData.difficulty
                        )}`}
                      >
                        {currentModuleData.difficulty}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Difficulty
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lessons List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white heading">
                    Lessons
                  </h3>

                  {currentModuleData.lessons.map((lesson, index) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {getLessonTypeIcon(lesson.type)}
                            </span>
                            {lesson.completed ? (
                              <FiCheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-neutral-600" />
                            )}
                          </div>

                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-1 heading">
                              {lesson.title}
                            </h4>
                            <p className="text-sm text-neutral-400 mb-2 body">
                              {lesson.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-neutral-500 body">
                              <span className="flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                {lesson.duration}
                              </span>
                              <span className="capitalize">{lesson.type}</span>
                            </div>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startLesson(lesson)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors body ${
                            lesson.completed
                              ? "bg-green-500/20 border border-green-500/30 text-green-400"
                              : `bg-${currentModuleData.color}-500/20 border border-${currentModuleData.color}-500/30 text-${currentModuleData.color}-400 hover:bg-${currentModuleData.color}-500/30`
                          }`}
                        >
                          {lesson.completed ? (
                            <>
                              <FiCheckCircle className="w-4 h-4" />
                              Review
                            </>
                          ) : (
                            <>
                              <FiPlay className="w-4 h-4" />
                              Start
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LearningPanel;
