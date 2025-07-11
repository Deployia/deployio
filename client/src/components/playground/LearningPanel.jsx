import { useState } from "react";
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

const LearningPanel = () => {
  const [activeModule, setActiveModule] = useState("docker");

  // Learning modules data
  const learningModules = [
    {
      id: "docker",
      title: "Docker Fundamentals",
      description: "Master containerization with Docker",
      icon: FiCode,
      color: "blue",
      progress: 60,
      totalLessons: 8,
      completedLessons: 5,
      estimatedTime: "4 hours",
      difficulty: "Beginner",
      lessons: [
        {
          id: "docker-1",
          title: "Introduction to Containers",
          duration: "15 min",
          type: "video",
          completed: true,
          description: "Understanding containers vs virtual machines"
        },
        {
          id: "docker-2",
          title: "Docker Installation & Setup",
          duration: "20 min",
          type: "hands-on",
          completed: true,
          description: "Installing Docker on different platforms"
        },
        {
          id: "docker-3",
          title: "Your First Container",
          duration: "25 min",
          type: "tutorial",
          completed: false,
          description: "Running your first Docker container"
        },
        {
          id: "docker-4",
          title: "Writing Dockerfiles",
          duration: "30 min",
          type: "hands-on",
          completed: false,
          description: "Creating custom Docker images"
        },
        {
          id: "docker-5",
          title: "Docker Compose Basics",
          duration: "35 min",
          type: "tutorial",
          completed: false,
          description: "Multi-container applications"
        }
      ]
    },
    {
      id: "cicd",
      title: "CI/CD Pipelines",
      description: "Automate your development workflow",
      icon: FiTrendingUp,
      color: "green",
      progress: 25,
      totalLessons: 6,
      completedLessons: 2,
      estimatedTime: "3 hours",
      difficulty: "Intermediate",
      lessons: [
        {
          id: "cicd-1",
          title: "CI/CD Concepts",
          duration: "20 min",
          type: "video",
          completed: true,
          description: "Understanding continuous integration and deployment"
        },
        {
          id: "cicd-2",
          title: "GitHub Actions Setup",
          duration: "30 min",
          type: "hands-on",
          completed: true,
          description: "Setting up your first GitHub Action"
        },
        {
          id: "cicd-3",
          title: "Building Test Pipelines",
          duration: "40 min",
          type: "tutorial",
          completed: false,
          description: "Automated testing in CI/CD"
        }
      ]
    },
    {
      id: "kubernetes",
      title: "Kubernetes Basics",
      description: "Container orchestration at scale",
      icon: FiSettings,
      color: "purple",
      progress: 0,
      totalLessons: 10,
      completedLessons: 0,
      estimatedTime: "6 hours",
      difficulty: "Advanced",
      lessons: [
        {
          id: "k8s-1",
          title: "Kubernetes Overview",
          duration: "25 min",
          type: "video",
          completed: false,
          description: "Introduction to Kubernetes architecture"
        },
        {
          id: "k8s-2",
          title: "Pods and Deployments",
          duration: "35 min",
          type: "hands-on",
          completed: false,
          description: "Working with basic Kubernetes resources"
        }
      ]
    },
    {
      id: "security",
      title: "DevOps Security",
      description: "Secure your DevOps pipeline",
      icon: FiShield,
      color: "red",
      progress: 0,
      totalLessons: 7,
      completedLessons: 0,
      estimatedTime: "5 hours",
      difficulty: "Intermediate",
      lessons: [
        {
          id: "sec-1",
          title: "Security Fundamentals",
          duration: "30 min",
          type: "video",
          completed: false,
          description: "DevSecOps principles and practices"
        }
      ]
    }
  ];

  const currentModuleData = learningModules.find(m => m.id === activeModule);

  const startLesson = (lesson) => {
    // Simulate lesson start
    console.log("Starting lesson:", lesson.title);
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case "video": return "🎥";
      case "hands-on": return "💻";
      case "tutorial": return "📖";
      default: return "📚";
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner": return "text-green-400";
      case "Intermediate": return "text-yellow-400";
      case "Advanced": return "text-red-400";
      default: return "text-neutral-400";
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Header */}
      <div className="p-6 border-b border-neutral-800/50">
        <div className="flex items-center gap-3 mb-4">
          <FiBookOpen className="w-6 h-6 text-green-400" />
          <div>
            <h2 className="text-2xl font-bold text-white heading">DevOps Learning Center</h2>
            <p className="text-neutral-400 body">
              Master DevOps skills with hands-on tutorials and interactive lessons
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiAward className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white heading">Completed Modules</span>
            </div>
            <div className="text-2xl font-bold text-white heading">1/4</div>
          </div>
          
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiClock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white heading">Total Hours</span>
            </div>
            <div className="text-2xl font-bold text-white heading">18h</div>
          </div>
          
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white heading">Community Rank</span>
            </div>
            <div className="text-2xl font-bold text-white heading">#47</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Module Sidebar */}
        <div className="w-80 border-r border-neutral-800/50 bg-neutral-950/50 p-4 overflow-auto custom-scrollbar">
          <h3 className="text-lg font-semibold text-white mb-4 heading">Learning Modules</h3>
          
          <div className="space-y-3">
            {learningModules.map((module) => {
              const Icon = module.icon;
              return (
                <motion.button
                  key={module.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveModule(module.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    activeModule === module.id
                      ? `bg-${module.color}-500/20 border-${module.color}-500/30`
                      : "bg-neutral-900/50 border-neutral-800/50 hover:border-neutral-700/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 text-${module.color}-400`} />
                    <span className="font-semibold text-white heading">{module.title}</span>
                  </div>
                  
                  <p className="text-sm text-neutral-400 mb-3 body">{module.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-800 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full bg-${module.color}-500`}
                      style={{ width: `${module.progress}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 body">
                      {module.completedLessons}/{module.totalLessons} lessons
                    </span>
                    <span className={`${getDifficultyColor(module.difficulty)} body`}>
                      {module.difficulty}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {currentModuleData && (
            <div>
              {/* Module Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <currentModuleData.icon className={`w-8 h-8 text-${currentModuleData.color}-400`} />
                  <div>
                    <h2 className="text-2xl font-bold text-white heading">{currentModuleData.title}</h2>
                    <p className="text-neutral-400 body">{currentModuleData.description}</p>
                  </div>
                </div>

                {/* Module Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-white heading">{currentModuleData.totalLessons}</div>
                    <div className="text-sm text-neutral-400 body">Total Lessons</div>
                  </div>
                  <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-white heading">{currentModuleData.estimatedTime}</div>
                    <div className="text-sm text-neutral-400 body">Estimated Time</div>
                  </div>
                  <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 text-center">
                    <div className={`text-lg font-bold heading ${getDifficultyColor(currentModuleData.difficulty)}`}>
                      {currentModuleData.difficulty}
                    </div>
                    <div className="text-sm text-neutral-400 body">Difficulty</div>
                  </div>
                </div>
              </div>

              {/* Lessons List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white heading">Lessons</h3>
                
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
                          <span className="text-lg">{getLessonTypeIcon(lesson.type)}</span>
                          {lesson.completed ? (
                            <FiCheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-neutral-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-1 heading">{lesson.title}</h4>
                          <p className="text-sm text-neutral-400 mb-2 body">{lesson.description}</p>
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
  );
};

export default LearningPanel;
