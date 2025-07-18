import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaFilter,
  FaStar,
  FaCodeBranch,
  FaClock,
  FaLock,
  FaGlobe,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaCode,
  FaEye,
} from "react-icons/fa";
import {
  fetchRepositories,
  setSelectedRepository,
  setRepositoryFilters,
  completeStep,
} from "@redux/slices/projectCreationSlice";

const RepositoryBrowser = ({ stepData, onNext, loading }) => {
  const dispatch = useDispatch();
  const [localFilters, setLocalFilters] = useState(stepData.repositoryFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch repositories when component mounts or filters change
  useEffect(() => {
    if (stepData.selectedProvider) {
      dispatch(
        fetchRepositories({
          provider: stepData.selectedProvider,
          ...localFilters,
          page: stepData.pagination.page,
          limit: stepData.pagination.limit,
        })
      );
    }
  }, [
    dispatch,
    stepData.selectedProvider,
    localFilters,
    stepData.pagination.page,
  ]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    dispatch(setRepositoryFilters(newFilters));
  };

  const handleRepositorySelect = (repository) => {
    dispatch(setSelectedRepository(repository));
  };

  const handleContinue = () => {
    if (stepData.selectedRepository) {
      dispatch(completeStep(2));
      onNext();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: "bg-yellow-500",
      TypeScript: "bg-blue-500",
      Python: "bg-green-500",
      Java: "bg-red-500",
      "C#": "bg-purple-500",
      PHP: "bg-indigo-500",
      Ruby: "bg-red-600",
      Go: "bg-cyan-500",
      Rust: "bg-orange-600",
      "C++": "bg-blue-600",
    };
    return colors[language] || "bg-neutral-500";
  };

  const sortOptions = [
    { value: "updated", label: "Recently Updated" },
    { value: "created", label: "Recently Created" },
    { value: "name", label: "Name" },
    { value: "stars", label: "Stars" },
  ];

  const typeOptions = [
    { value: "all", label: "All Repositories" },
    { value: "public", label: "Public Only" },
    { value: "private", label: "Private Only" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <FaCodeBranch className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Select Your Repository
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto px-2">
            Choose the repository you want to deploy. We&apos;ll analyze its
            structure and dependencies to create the optimal deployment
            configuration.
          </p>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={localFilters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center sm:justify-start gap-2 text-neutral-400 hover:text-white transition-colors py-2 sm:py-0"
          >
            <FaFilter className="w-4 h-4" />
            <span className="text-sm sm:text-base">Filters</span>
            {showFilters ? (
              <FaChevronUp className="w-4 h-4" />
            ) : (
              <FaChevronDown className="w-4 h-4" />
            )}
          </button>

          <div className="text-xs sm:text-sm text-neutral-400 text-center sm:text-right">
            {stepData.repositories.length} repositories found
          </div>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-neutral-800/50 rounded-lg border border-neutral-700"
            >
              {/* Sort Option */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Sort by
                </label>
                <select
                  value={localFilters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Repository Type
                </label>
                <select
                  value={localFilters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Repository List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-neutral-400">
              Loading repositories...
            </span>
          </div>
        ) : stepData.repositories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCode className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg font-medium text-neutral-300 mb-2">
              No repositories found
            </h3>
            <p className="text-neutral-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          stepData.repositories.map((repo, index) => {
            const isSelected = stepData.selectedRepository?.id === repo.id;

            return (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  p-4 sm:p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer
                  ${
                    isSelected
                      ? "bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/20"
                      : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/70"
                  }
                `}
                onClick={() => handleRepositorySelect(repo)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Repository Name and Privacy */}
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {repo.fullName || `${repo.owner}/${repo.name}`}
                      </h3>
                      {repo.isPrivate ? (
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <FaLock className="w-3 h-3" />
                          <span className="text-xs font-medium">Private</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-green-400">
                          <FaGlobe className="w-3 h-3" />
                          <span className="text-xs font-medium">Public</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {repo.description && (
                      <p className="text-neutral-300 mb-3 text-sm">
                        {repo.description}
                      </p>
                    )}

                    {/* Repository Stats */}
                    <div className="flex items-center space-x-6 text-sm text-neutral-400">
                      {repo.language && (
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getLanguageColor(
                              repo.language
                            )}`}
                          />
                          <span>{repo.language}</span>
                        </div>
                      )}

                      {repo.stars > 0 && (
                        <div className="flex items-center space-x-1">
                          <FaStar className="w-3 h-3" />
                          <span>{repo.stars}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-1">
                        <FaClock className="w-3 h-3" />
                        <span>Updated {formatDate(repo.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Topics */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {repo.topics.slice(0, 5).map((topic) => (
                          <span
                            key={topic}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                        {repo.topics.length > 5 && (
                          <span className="px-2 py-1 bg-neutral-700 text-neutral-400 text-xs rounded-full">
                            +{repo.topics.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-4"
                    >
                      <FaEye className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {stepData.pagination.total > stepData.pagination.limit && (
        <div className="mt-8 flex items-center justify-center space-x-4">
          <button
            disabled={stepData.pagination.page === 1}
            className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
          >
            Previous
          </button>
          <span className="text-neutral-400">
            Page {stepData.pagination.page} of{" "}
            {Math.ceil(stepData.pagination.total / stepData.pagination.limit)}
          </span>
          <button
            disabled={!stepData.pagination.hasNext}
            className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleContinue}
          disabled={!stepData.selectedRepository || loading}
          className={`
            px-8 py-3 rounded-lg font-medium transition-all
            ${
              stepData.selectedRepository && !loading
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
            }
          `}
        >
          Continue with{" "}
          {stepData.selectedRepository?.name || "Selected Repository"}
        </button>
      </div>
    </div>
  );
};

export default RepositoryBrowser;
