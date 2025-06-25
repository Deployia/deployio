import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaGithub,
  FaGitlab,
  FaSearch,
  FaFolder,
  FaStar,
  FaCodeBranch,
  FaClock,
  FaEye,
  FaLock,
  FaGlobe,
  FaRefresh,
  FaExternalLinkAlt,
  FaPlus,
  FaArrowRight,
} from "react-icons/fa";
import { LoadingGrid } from "@components/LoadingSpinner";
import { useGitProviders } from "@hooks/useGitProviders";
import {
  fetchRepositories,
  searchRepositories,
} from "@redux/slices/gitProviderSlice";

const RepositoryBrowser = ({
  onRepositorySelect,
  allowMultiple = false,
  showCreateProjectButton = true,
}) => {
  const dispatch = useDispatch();
  const { connectedProviders, repositories, initiateConnection } =
    useGitProviders();

  const [activeProvider, setActiveProvider] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepos, setSelectedRepos] = useState(allowMultiple ? [] : null);

  // Set active provider to first connected provider
  useEffect(() => {
    if (connectedProviders.length > 0 && !activeProvider) {
      setActiveProvider(connectedProviders[0].provider);
    }
  }, [connectedProviders, activeProvider]);

  // Fetch repositories when provider changes
  useEffect(() => {
    if (activeProvider && !repositories[activeProvider]?.data?.length) {
      dispatch(fetchRepositories({ provider: activeProvider, page: 1 }));
    }
  }, [activeProvider, dispatch, repositories]);

  const getProviderIcon = (provider) => {
    switch (provider) {
      case "github":
        return FaGithub;
      case "gitlab":
        return FaGitlab;
      default:
        return FaFolder;
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

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (activeProvider) {
      if (query.trim()) {
        dispatch(
          searchRepositories({
            provider: activeProvider,
            query: query.trim(),
            page: 1,
          })
        );
      } else {
        dispatch(fetchRepositories({ provider: activeProvider, page: 1 }));
      }
    }
  };

  const handleRepositorySelect = (repository) => {
    if (allowMultiple) {
      const newSelection = selectedRepos.includes(repository.id)
        ? selectedRepos.filter((id) => id !== repository.id)
        : [...selectedRepos, repository.id];
      setSelectedRepos(newSelection);
      onRepositorySelect?.(
        newSelection
          .map((id) =>
            repositories[activeProvider]?.data?.find((repo) => repo.id === id)
          )
          .filter(Boolean)
      );
    } else {
      setSelectedRepos(repository);
      onRepositorySelect?.(repository);
    }
  };

  const handleRefresh = () => {
    if (activeProvider) {
      if (searchQuery.trim()) {
        dispatch(
          searchRepositories({
            provider: activeProvider,
            query: searchQuery.trim(),
            page: 1,
          })
        );
      } else {
        dispatch(fetchRepositories({ provider: activeProvider, page: 1 }));
      }
    }
  };

  const handleLoadMore = () => {
    const repoData = repositories[activeProvider];
    if (repoData?.pagination?.hasMore) {
      const nextPage = repoData.pagination.page + 1;
      if (searchQuery.trim()) {
        dispatch(
          searchRepositories({
            provider: activeProvider,
            query: searchQuery.trim(),
            page: nextPage,
          })
        );
      } else {
        dispatch(
          fetchRepositories({ provider: activeProvider, page: nextPage })
        );
      }
    }
  };

  const currentRepoData = activeProvider ? repositories[activeProvider] : null;
  const isLoading = currentRepoData?.loading && !currentRepoData?.data?.length;

  // If no providers are connected, show connection prompt
  if (connectedProviders.length === 0) {
    return (
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <FaGithub className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Connect a Git Provider
          </h3>
          <p className="text-gray-400 mb-6">
            To import repositories, you need to connect a Git provider first.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => initiateConnection("github")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaGithub className="w-4 h-4" />
              Connect GitHub
            </button>
            <button
              onClick={() => initiateConnection("gitlab")}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FaGitlab className="w-4 h-4" />
              Connect GitLab
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Select Repository
          </h2>
          <p className="text-sm text-gray-400">
            Choose a repository from your connected providers
          </p>
        </div>
        {showCreateProjectButton && selectedRepos && (
          <button
            onClick={() => onRepositorySelect?.(selectedRepos)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaArrowRight className="w-4 h-4" />
            Continue with Selected
          </button>
        )}
      </div>

      {/* Provider Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800/50">
        {connectedProviders.map((connection) => {
          const { provider } = connection;
          const ProviderIcon = getProviderIcon(provider);
          const isActive = activeProvider === provider;

          return (
            <button
              key={provider}
              onClick={() => setActiveProvider(provider)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                isActive
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <ProviderIcon className="w-4 h-4" />
              <span className="capitalize">{provider}</span>
              <span className="text-xs bg-neutral-800 px-2 py-1 rounded-full">
                {connection.repositories?.count || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeProvider} repositories...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={currentRepoData?.loading}
          className="p-2 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
          title="Refresh repositories"
        >
          <FaRefresh
            className={`w-4 h-4 ${
              currentRepoData?.loading ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* Repository List */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingGrid columns={1} rows={6} />
        ) : currentRepoData?.error ? (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <FaEye className="w-4 h-4" />
              <span className="font-medium">Error Loading Repositories</span>
            </div>
            <p className="text-sm text-red-300">{currentRepoData.error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : currentRepoData?.data?.length > 0 ? (
          <>
            <AnimatePresence>
              {currentRepoData.data.map((repository) => {
                const isSelected = allowMultiple
                  ? selectedRepos.includes(repository.id)
                  : selectedRepos?.id === repository.id;

                return (
                  <motion.div
                    key={repository.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`bg-neutral-800/30 border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-neutral-700/50 hover:border-neutral-600/50"
                    }`}
                    onClick={() => handleRepositorySelect(repository)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium truncate">
                            {repository.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {repository.private ? (
                              <FaLock
                                className="w-3 h-3 text-yellow-400"
                                title="Private"
                              />
                            ) : (
                              <FaGlobe
                                className="w-3 h-3 text-green-400"
                                title="Public"
                              />
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                              <FaEye className="w-3 h-3" />
                              Selected
                            </div>
                          )}
                        </div>

                        {repository.description && (
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                            {repository.description}
                          </p>
                        )}

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
                              <span>
                                Updated {formatDate(repository.updatedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            repository.url,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        title="View on platform"
                      >
                        <FaExternalLinkAlt className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Load More */}
            {currentRepoData?.pagination?.hasMore && (
              <div className="pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={currentRepoData.loading}
                  className="w-full py-3 px-4 bg-neutral-800 text-gray-300 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {currentRepoData.loading ? (
                    <>
                      <FaRefresh className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FaPlus className="w-4 h-4" />
                      Load More (
                      {currentRepoData.pagination.totalCount -
                        currentRepoData.data.length}{" "}
                      remaining)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FaFolder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery
                ? "No repositories found"
                : "No repositories available"}
            </h3>
            <p className="text-gray-400 mb-4">
              {searchQuery
                ? `No repositories match "${searchQuery}"`
                : `No repositories found in your ${activeProvider} account`}
            </p>
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryBrowser;
