import { useState } from "react";
import { motion } from "framer-motion";
import { FiBookOpen, FiPlay, FiCheckCircle, FiClock } from "react-icons/fi";

const LearningPanel = ({
  currentTopic = "devops-fundamentals",
  workspace: _workspace,
}) => {
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());

  // Sample learning content
  const learningModules = {
    "devops-fundamentals": {
      title: "DevOps Fundamentals",
      description: "Learn the core concepts of DevOps and CI/CD",
      lessons: [
        {
          id: "intro-devops",
          title: "Introduction to DevOps",
          duration: "15 min",
          type: "video",
          description: "Understanding the DevOps culture and practices",
        },
        {
          id: "ci-cd-basics",
          title: "CI/CD Pipeline Basics",
          duration: "20 min",
          type: "interactive",
          description: "Building your first CI/CD pipeline",
        },
        {
          id: "containerization",
          title: "Containerization with Docker",
          duration: "30 min",
          type: "hands-on",
          description: "Creating and managing Docker containers",
        },
      ],
    },
  };

  const currentModule = learningModules[currentTopic];

  const startLesson = (lesson) => {
    setActiveLesson(lesson);
  };

  const completeLesson = (lessonId) => {
    setCompletedLessons((prev) => new Set([...prev, lessonId]));
    setActiveLesson(null);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800/50">
        <div className="flex items-center gap-3 mb-3">
          <FiBookOpen className="w-6 h-6 text-green-400" />
          <div>
            <h2 className="text-lg font-medium text-white">
              {currentModule.title}
            </h2>
            <p className="text-sm text-gray-400">{currentModule.description}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Progress</span>
            <span className="text-sm text-green-400">
              {Math.round(
                (completedLessons.size / currentModule.lessons.length) * 100
              )}
              %
            </span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${
                  (completedLessons.size / currentModule.lessons.length) * 100
                }%`,
              }}
              className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {currentModule.lessons.map((lesson, index) => {
            const isCompleted = completedLessons.has(lesson.id);
            const isActive = activeLesson?.id === lesson.id;

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all
                  ${
                    isActive
                      ? "bg-blue-500/20 border-blue-500/50"
                      : isCompleted
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-neutral-800/50 border-neutral-700/50 hover:border-neutral-600/50"
                  }
                `}
                onClick={() => startLesson(lesson)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${
                        isCompleted
                          ? "bg-green-500/20 text-green-400"
                          : isActive
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-neutral-700/50 text-gray-400"
                      }
                    `}
                    >
                      {isCompleted ? (
                        <FiCheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">
                        {lesson.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        {lesson.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          <span>{lesson.duration}</span>
                        </div>
                        <span className="capitalize">{lesson.type}</span>
                      </div>
                    </div>
                  </div>

                  {!isCompleted && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        startLesson(lesson);
                      }}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      <FiPlay className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Active Lesson */}
      {activeLesson && (
        <div className="border-t border-neutral-800/50 bg-neutral-900/30 p-4">
          <div className="mb-3">
            <h3 className="text-white font-medium mb-1">
              {activeLesson.title}
            </h3>
            <p className="text-sm text-gray-400">{activeLesson.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => completeLesson(activeLesson.id)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-colors"
            >
              <FiCheckCircle className="w-4 h-4" />
              <span>Mark Complete</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveLesson(null)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </motion.button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="p-4 border-t border-neutral-800/50 bg-neutral-900/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">
              {completedLessons.size}
            </div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">
              {currentModule.lessons.length - completedLessons.size}
            </div>
            <div className="text-xs text-gray-400">Remaining</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-400">
              {completedLessons.size >= currentModule.lessons.length ? 1 : 0}
            </div>
            <div className="text-xs text-gray-400">Certificates</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPanel;
