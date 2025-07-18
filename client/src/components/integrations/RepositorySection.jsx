import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaSyncAlt, FaFolder, FaEye } from "react-icons/fa";
import { RepositoryCardSkeleton } from "@components/LoadingSpinner";
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
  maxRepositoriesPerPage = 5,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Get the single provider
  const provider = connectedProviders[0]?.provider;
  const connection = connectedProviders[0];
  const repoData = repositories[provider];

  // Pagination for repositories
  const getVisibleRepositories = (repos) => {
    const endIndex = currentPage * maxRepositoriesPerPage;
    return repos.slice(0, endIndex);
  };

  const hasMoreRepositories = (repos) => {
    const totalShown = currentPage * maxRepositoriesPerPage;
    return repos.length > totalShown;
  };

  const handleLoadMoreRepositories = () => {
    setCurrentPage((prev) => prev + 1);
  };

  // Auto-fetch repositories on mount
  useEffect(() => {
    if (provider && (!repoData?.data?.length || repoData?.lastFetch === null)) {
      dispatch(fetchRepositories({ provider, page: 1 }));
    }
  }, [provider, repoData?.data?.length, repoData?.lastFetch, dispatch]);

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (query.trim()) {
      dispatch(searchRepositories({ provider, query: query.trim(), page: 1 }));
    } else {
      dispatch(clearRepositorySearch({ provider }));
      dispatch(fetchRepositories({ provider, page: 1 }));
    }
  };

  const handleRefresh = () => {
    if (searchQuery?.trim()) {
      dispatch(
        searchRepositories({ provider, query: searchQuery.trim(), page: 1 })
      );
    } else {
      dispatch(fetchRepositories({ provider, page: 1 }));
    }
  };

  const handleLoadMore = () => {
    const nextPage = repoData.pagination.page + 1;

    if (searchQuery?.trim()) {
      dispatch(
        searchRepositories({
          provider,
          query: searchQuery.trim(),
          page: nextPage,
        })
      );
    } else {
      dispatch(fetchRepositories({ provider, page: nextPage }));
    }
  };

  if (connectedProviders.length === 0 || !provider) {
    return null;
  }

  const ProviderIcon = getProviderIcon(provider);
  const providerColor = getProviderColor(provider);
  const providerBgColor = getProviderBgColor(provider);

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${providerBgColor} rounded-lg`}>
            <ProviderIcon className={`w-5 h-5 ${providerColor}`} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white heading">
              {getProviderDisplayName(provider)} Repositories
            </h2>
            <p className="text-sm text-gray-400 body">
              {repoData?.data?.length || 0} repositories loaded
              {connection?.lastSync && (
                <span className="ml-2">
                  • Last synced:{" "}
                  {new Date(connection.lastSync).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
          <div className="ml-auto">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-neutral-600/30 transition-colors"
              title="Refresh repositories"
            >
              <FaSyncAlt
                className={`w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors ${
                  repoData?.loading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${getProviderDisplayName(
              provider
            )} repositories...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors text-sm sm:text-base"
          />
        </div>

        {/* Repository List */}
        {repoData?.loading && !repoData?.data?.length ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <RepositoryCardSkeleton key={i} />
            ))}
          </div>
        ) : repoData?.error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <FaEye className="w-4 h-4" />
              <span className="font-medium">Error Loading Repositories</span>
            </div>
            <p className="text-sm text-red-300 mb-3">{repoData.error}</p>
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors border border-red-500/30"
            >
              Retry
            </button>
          </div>
        ) : repoData?.data?.length > 0 ? (
          <div className="space-y-3">
            {/* Show paginated repositories */}
            {getVisibleRepositories(repoData.data).map((repo) => (
              <RepositoryCard
                key={repo.id}
                repository={repo}
                provider={provider}
              />
            ))}

            {/* Load More Repositories Button */}
            {hasMoreRepositories(repoData.data) && (
              <div className="flex justify-center pt-3 border-t border-neutral-600/50">
                <button
                  onClick={handleLoadMoreRepositories}
                  className="px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <span>Show More</span>
                  <span className="text-xs opacity-80">
                    (
                    {repoData.data.length -
                      getVisibleRepositories(repoData.data).length}{" "}
                    more)
                  </span>
                </button>
              </div>
            )}

            {/* API Load More Button if needed */}
            {repoData?.pagination?.hasMore && (
              <div className="flex justify-center pt-3 border-t border-neutral-600/50">
                <button
                  onClick={handleLoadMore}
                  disabled={repoData.loading}
                  className="px-4 py-2 bg-green-600/80 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {repoData.loading ? "Loading..." : "Load More from API"}
                </button>
              </div>
            )}

            {/* View All Button */}
            {showViewAllButton && (
              <div className="flex justify-center pt-3 border-t border-neutral-600/50">
                <button
                  onClick={() =>
                    navigate(`/dashboard/integrations/${provider}`)
                  }
                  className="px-4 py-2 bg-neutral-600/50 text-white rounded-lg hover:bg-neutral-500/50 transition-colors text-sm font-medium border border-neutral-500/50"
                >
                  View All in {getProviderDisplayName(provider)} Integration
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <FaFolder className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm sm:text-base">
              {searchQuery
                ? `No repositories found matching "${searchQuery}"`
                : "No repositories found"}
            </p>
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors"
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

export default RepositorySection;
