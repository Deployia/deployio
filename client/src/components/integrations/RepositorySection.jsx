import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaGitlab,
  FaSearch,
  FaSyncAlt,
  FaChevronDown,
  FaFolder,
  FaEye,
} from "react-icons/fa";
import { LoadingGrid } from "@components/LoadingSpinner";
import { RepositoryCard } from "./";
import {
  fetchRepositories,
  searchRepositories,
  clearRepositorySearch,
} from "@redux/slices/gitProviderSlice";

const RepositorySection = ({
  connectedProviders,
  repositories,
  maxHeight = "400px",
  showViewAllButton = true,
  className = "",
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [expandedProvider, setExpandedProvider] = useState(null);
  const [searchQueries, setSearchQueries] = useState({});

  // Auto-expand first connected provider and fetch repositories
  useEffect(() => {
    if (connectedProviders.length > 0 && !expandedProvider) {
      const firstProvider = connectedProviders[0].provider;
      setExpandedProvider(firstProvider);

      // Auto-fetch repositories for the first provider if no data exists
      if (
        !repositories[firstProvider]?.data?.length ||
        repositories[firstProvider]?.lastFetch === null
      ) {
        dispatch(fetchRepositories({ provider: firstProvider, page: 1 }));
      }
    }
  }, [connectedProviders, expandedProvider, repositories, dispatch]);

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

  const handleProviderToggle = (provider) => {
    const isExpanding = expandedProvider !== provider;
    setExpandedProvider(isExpanding ? provider : null);

    // Fetch repositories if expanding and no data exists
    if (
      isExpanding &&
      (!repositories[provider]?.data?.length ||
        repositories[provider]?.lastFetch === null)
    ) {
      dispatch(fetchRepositories({ provider, page: 1 }));
    }
  };

  const handleSearch = (provider, query) => {
    setSearchQueries((prev) => ({ ...prev, [provider]: query }));

    if (query.trim()) {
      dispatch(searchRepositories({ provider, query: query.trim(), page: 1 }));
    } else {
      dispatch(clearRepositorySearch({ provider }));
      dispatch(fetchRepositories({ provider, page: 1 }));
    }
  };

  const handleRefresh = (provider) => {
    const query = searchQueries[provider];
    if (query?.trim()) {
      dispatch(searchRepositories({ provider, query: query.trim(), page: 1 }));
    } else {
      dispatch(fetchRepositories({ provider, page: 1 }));
    }
  };

  const handleLoadMore = (provider) => {
    const repoData = repositories[provider];
    if (repoData?.pagination?.hasMore) {
      const query = searchQueries[provider];
      const nextPage = repoData.pagination.page + 1;

      if (query?.trim()) {
        dispatch(
          searchRepositories({ provider, query: query.trim(), page: nextPage })
        );
      } else {
        dispatch(fetchRepositories({ provider, page: nextPage }));
      }
    }
  };

  // Remove unused function warning by keeping it for potential future use
  // eslint-disable-next-line no-unused-vars
  const _handleLoadMore = handleLoadMore;

  if (connectedProviders.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <FaFolder className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">
            Repository Management
          </h2>
          <p className="text-sm text-gray-400">
            Browse and manage repositories from your connected providers
          </p>
        </div>
      </div>

      <div className="space-y-4" style={{ maxHeight, overflowY: "auto" }}>
        {connectedProviders.map((connection) => {
          const { provider } = connection;
          const repoData = repositories[provider];
          const isExpanded = expandedProvider === provider;
          const ProviderIcon = getProviderIcon(provider);

          return (
            <motion.div
              key={provider}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl overflow-hidden"
            >
              {/* Provider Header */}
              <button
                onClick={() => handleProviderToggle(provider)}
                className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <ProviderIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium text-white capitalize">
                      {provider} Repositories
                    </h3>
                    <p className="text-sm text-gray-400">
                      {connection.repositories?.count || 0} repositories
                      {connection.lastSync && (
                        <span className="ml-2">
                          • Last synced:{" "}
                          {new Date(connection.lastSync).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaSyncAlt
                    className={`w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer ${
                      repoData?.loading ? "animate-spin" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRefresh(provider);
                    }}
                    title="Refresh repositories"
                  />
                  <FaChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Repository Content */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-neutral-800/50"
                >
                  <div className="p-4 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search ${provider} repositories...`}
                        value={searchQueries[provider] || ""}
                        onChange={(e) => handleSearch(provider, e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {/* Repository List */}
                    {repoData?.loading && !repoData?.data?.length ? (
                      <LoadingGrid columns={1} rows={3} />
                    ) : repoData?.error ? (
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-400 mb-2">
                          <FaEye className="w-4 h-4" />
                          <span className="font-medium">
                            Error Loading Repositories
                          </span>
                        </div>
                        <p className="text-sm text-red-300">{repoData.error}</p>
                        <button
                          onClick={() => handleRefresh(provider)}
                          className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    ) : repoData?.data?.length > 0 ? (
                      <div className="space-y-3">
                        {/* Show only first 3 repositories for preview */}
                        {repoData.data.slice(0, 3).map((repo) => (
                          <RepositoryCard
                            key={repo.id}
                            repository={repo}
                            provider={provider}
                          />
                        ))}

                        {/* View All Button */}
                        {showViewAllButton && (
                          <div className="pt-4 border-t border-neutral-800/50">
                            <button
                              onClick={() =>
                                navigate(`/dashboard/integrations/${provider}`)
                              }
                              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View All {repoData.data.length} {provider}{" "}
                              Repositories
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FaFolder className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">
                          {searchQueries[provider]
                            ? `No repositories found matching "${searchQueries[provider]}"`
                            : "No repositories found"}
                        </p>
                        {searchQueries[provider] && (
                          <button
                            onClick={() => handleSearch(provider, "")}
                            className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RepositorySection;
