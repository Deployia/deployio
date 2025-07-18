import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
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
import {
  getProviderIcon,
  getProviderDisplayName,
  getProviderColor,
  getProviderBgColor,
} from "@utils/providerUtils";

const RepositorySection = ({
  connectedProviders,
  repositories,
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

  if (connectedProviders.length === 0) {
    return null;
  }

  return (
    <div
      className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl ${className}`}
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-neutral-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <FaFolder className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white heading">
              Repository Management
            </h2>
            <p className="text-sm text-gray-400 body">
              Browse and manage repositories from your connected providers
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {connectedProviders.map((connection) => {
            const { provider } = connection;
            const repoData = repositories[provider];
            const isExpanded = expandedProvider === provider;
            const ProviderIcon = getProviderIcon(provider);
            const providerColor = getProviderColor(provider);
            const providerBgColor = getProviderBgColor(provider);

            return (
              <motion.div
                key={provider}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-800/30 backdrop-blur-sm border border-neutral-700/50 rounded-xl overflow-hidden"
              >
                {/* Provider Header */}
                <button
                  onClick={() => handleProviderToggle(provider)}
                  className="w-full p-4 flex items-center justify-between hover:bg-neutral-700/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${providerBgColor} rounded-lg`}>
                      <ProviderIcon className={`w-5 h-5 ${providerColor}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base sm:text-lg font-medium text-white">
                        {getProviderDisplayName(provider)} Repositories
                      </h3>
                      <p className="text-sm text-gray-400">
                        {repoData?.data?.length || 0} repositories loaded
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefresh(provider);
                      }}
                      className="p-2 rounded-lg hover:bg-neutral-600/30 transition-colors"
                      title="Refresh repositories"
                    >
                      <FaSyncAlt
                        className={`w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors ${
                          repoData?.loading ? "animate-spin" : ""
                        }`}
                      />
                    </button>
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
                    className="border-t border-neutral-700/50"
                  >
                    <div className="p-4 space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={`Search ${getProviderDisplayName(
                            provider
                          )} repositories...`}
                          value={searchQueries[provider] || ""}
                          onChange={(e) =>
                            handleSearch(provider, e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2 sm:py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors text-sm sm:text-base"
                        />
                      </div>

                      {/* Repository List */}
                      {repoData?.loading && !repoData?.data?.length ? (
                        <div className="space-y-3">
                          <LoadingGrid columns={1} rows={3} />
                        </div>
                      ) : repoData?.error ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-red-400 mb-2">
                            <FaEye className="w-4 h-4" />
                            <span className="font-medium">
                              Error Loading Repositories
                            </span>
                          </div>
                          <p className="text-sm text-red-300 mb-3">
                            {repoData.error}
                          </p>
                          <button
                            onClick={() => handleRefresh(provider)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors border border-red-500/30"
                          >
                            Retry
                          </button>
                        </div>
                      ) : repoData?.data?.length > 0 ? (
                        <div className="space-y-3">
                          {/* Show all repositories */}
                          {repoData.data.map((repo) => (
                            <RepositoryCard
                              key={repo.id}
                              repository={repo}
                              provider={provider}
                            />
                          ))}

                          {/* Load More Button if needed */}
                          {repoData?.pagination?.hasMore && (
                            <div className="pt-4 border-t border-neutral-700/50">
                              <button
                                onClick={() => handleLoadMore(provider)}
                                disabled={repoData.loading}
                                className="w-full py-2 sm:py-3 px-4 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                              >
                                {repoData.loading
                                  ? "Loading..."
                                  : "Load More Repositories"}
                              </button>
                            </div>
                          )}

                          {/* View All Button */}
                          {showViewAllButton && (
                            <div className="pt-4 border-t border-neutral-700/50">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/dashboard/integrations/${provider}`
                                  )
                                }
                                className="w-full py-2 sm:py-3 px-4 bg-neutral-700/50 text-white rounded-lg hover:bg-neutral-600/50 transition-colors text-sm sm:text-base font-medium border border-neutral-600/50"
                              >
                                View All in {getProviderDisplayName(provider)}{" "}
                                Integration
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 sm:py-12">
                          <FaFolder className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400 text-sm sm:text-base">
                            {searchQueries[provider]
                              ? `No repositories found matching "${searchQueries[provider]}"`
                              : "No repositories found"}
                          </p>
                          {searchQueries[provider] && (
                            <button
                              onClick={() => handleSearch(provider, "")}
                              className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors"
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
    </div>
  );
};

export default RepositorySection;
