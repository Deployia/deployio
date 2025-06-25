import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaGitlab,
  FaStar,
  FaCodeBranch,
  FaEye,
  FaLock,
  FaGlobe,
  FaRocket,
  FaExternalLinkAlt,
  FaClock,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const RepositoryCard = ({ repository, provider }) => {
  const navigate = useNavigate();
  const [isSelecting, setIsSelecting] = useState(false);

  const getProviderIcon = (provider) => {
    switch (provider) {
      case "github":
        return FaGithub;
      case "gitlab":
        return FaGitlab;
      default:
        return FaCodeBranch;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const handleCreateProject = async () => {
    setIsSelecting(true);
    try {
      // Navigate to create project page with repository pre-selected
      navigate("/dashboard/projects/create", {
        state: {
          repository: {
            id: repository.id,
            name: repository.name,
            fullName: repository.fullName || repository.name,
            url: repository.url,
            cloneUrl: repository.cloneUrl,
            defaultBranch: repository.defaultBranch || "main",
            provider: provider,
            private: repository.private,
            description: repository.description,
          },
        },
      });

      toast.success(`Selected ${repository.name} for new project`);
    } catch (error) {
      toast.error("Failed to select repository");
      console.error("Repository selection error:", error);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleViewRepository = () => {
    if (repository.url) {
      window.open(repository.url, "_blank", "noopener,noreferrer");
    }
  };

  const ProviderIcon = getProviderIcon(provider);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-4 hover:border-neutral-600/50 transition-all group"
    >
      <div className="flex items-start justify-between">
        {/* Repository Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <ProviderIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <h4 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
              {repository.name}
            </h4>
            <div className="flex items-center gap-1">
              {repository.private ? (
                <FaLock
                  className="w-3 h-3 text-yellow-400"
                  title="Private repository"
                />
              ) : (
                <FaGlobe
                  className="w-3 h-3 text-green-400"
                  title="Public repository"
                />
              )}
            </div>
          </div>

          {repository.description && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {repository.description}
            </p>
          )}

          {/* Repository Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {repository.language && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span>{repository.language}</span>
              </div>
            )}

            {repository.stars !== undefined && (
              <div className="flex items-center gap-1">
                <FaStar className="w-3 h-3" />
                <span>{formatNumber(repository.stars)}</span>
              </div>
            )}

            {repository.forks !== undefined && (
              <div className="flex items-center gap-1">
                <FaCodeBranch className="w-3 h-3" />
                <span>{formatNumber(repository.forks)}</span>
              </div>
            )}

            {repository.updatedAt && (
              <div className="flex items-center gap-1">
                <FaClock className="w-3 h-3" />
                <span>Updated {formatDate(repository.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleViewRepository}
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
            title="View on platform"
          >
            <FaExternalLinkAlt className="w-4 h-4" />
          </button>

          <button
            onClick={handleCreateProject}
            disabled={isSelecting}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSelecting ? (
              <>
                <FaRocket className="w-3 h-3 animate-spin" />
                Selecting...
              </>
            ) : (
              <>
                <FaRocket className="w-3 h-3" />
                Deploy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Additional Metadata */}
      {(repository.defaultBranch || repository.size !== undefined) && (
        <div className="mt-3 pt-3 border-t border-neutral-700/50">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {repository.defaultBranch && (
              <div className="flex items-center gap-1">
                <FaCodeBranch className="w-3 h-3" />
                <span>Default: {repository.defaultBranch}</span>
              </div>
            )}

            {repository.size !== undefined && (
              <div className="flex items-center gap-1">
                <FaEye className="w-3 h-3" />
                <span>{formatNumber(repository.size)} KB</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RepositoryCard;
