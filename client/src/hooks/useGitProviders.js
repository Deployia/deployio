import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";

import {
  fetchConnectedProviders,
  fetchDetailedConnectionStatus,
  fetchRepositories,
  searchRepositories,
  disconnectProvider,
  refreshProviderConnection,
  setActiveCategory,
  selectConnections,
  selectRepositories,
  selectUI,
  selectConnectedProviders,
} from "@redux/slices/gitProviderSlice";

import gitProviderService from "@/services/gitProviderService";

/**
 * Custom hook for Git Provider operations
 * Encapsulates all Git provider related state and operations
 */
export const useGitProviders = () => {
  const dispatch = useDispatch();

  // Selectors
  const connections = useSelector(selectConnections);
  const repositories = useSelector(selectRepositories);
  const ui = useSelector(selectUI);
  const connectedProviders = useSelector(selectConnectedProviders);

  // UI State
  const {
    activeCategory,
    connectionsLoading,
    connectionsError,
    refreshingProvider,
    selectedProvider,
    showConnectModal,
  } = ui;

  // Connection Operations
  const fetchConnections = useCallback(() => {
    dispatch(fetchConnectedProviders());
  }, [dispatch]);

  const fetchDetailedConnections = useCallback(() => {
    dispatch(fetchDetailedConnectionStatus());
  }, [dispatch]);

  const connectProvider = useCallback((provider) => {
    if (provider.comingSoon) {
      toast.error(`${provider.name} integration is coming in Q3 2025`);
      return;
    }

    if (!provider.enabled) {
      toast.error(`${provider.name} integration is currently disabled`);
      return;
    }

    try {
      gitProviderService.initiateConnection(provider.id);
    } catch (error) {
      console.error("Connection initiation failed:", error);
      toast.error(`Failed to initiate connection to ${provider.name}`);
    }
  }, []);

  const disconnectProviderHandler = useCallback(
    async (provider) => {
      if (
        window.confirm(`Are you sure you want to disconnect ${provider.name}?`)
      ) {
        try {
          await dispatch(disconnectProvider(provider.id)).unwrap();
          toast.success(`Successfully disconnected from ${provider.name}`);
          fetchConnections();
        } catch (error) {
          console.error("Disconnection failed:", error);
          toast.error(`Failed to disconnect from ${provider.name}`);
        }
      }
    },
    [dispatch, fetchConnections]
  );

  const refreshProvider = useCallback(
    async (providerId) => {
      try {
        await dispatch(refreshProviderConnection(providerId)).unwrap();
        toast.success("Provider connection refreshed");
      } catch (error) {
        console.error("Refresh failed:", error);
        toast.error("Failed to refresh provider connection");
      }
    },
    [dispatch]
  );

  // Repository Operations
  const fetchProviderRepositories = useCallback(
    async (providerId, page = 1) => {
      try {
        await dispatch(
          fetchRepositories({ provider: providerId, page })
        ).unwrap();
      } catch (error) {
        console.error("Failed to fetch repositories:", error);
        toast.error(`Failed to fetch ${providerId} repositories`);
      }
    },
    [dispatch]
  );

  const searchProviderRepositories = useCallback(
    async (providerId, query, page = 1) => {
      try {
        await dispatch(
          searchRepositories({ provider: providerId, query, page })
        ).unwrap();
      } catch (error) {
        console.error("Failed to search repositories:", error);
        toast.error(`Failed to search ${providerId} repositories`);
      }
    },
    [dispatch]
  );

  // UI Operations
  const changeCategoryHandler = useCallback(
    (category) => {
      dispatch(setActiveCategory(category));
    },
    [dispatch]
  );

  // Utility functions
  const getProviderConnection = useCallback(
    (providerId) => {
      return (
        connections[providerId] || {
          connected: false,
          username: null,
          avatar: null,
          lastSync: null,
          repositories: { count: 0, private: 0, public: 0 },
        }
      );
    },
    [connections]
  );

  const getProviderRepositories = useCallback(
    (providerId) => {
      return (
        repositories[providerId] || {
          loading: false,
          data: [],
          pagination: { page: 1, totalPages: 1, totalCount: 0, hasMore: false },
          error: null,
          searchQuery: "",
          lastFetch: null,
        }
      );
    },
    [repositories]
  );

  const isProviderConnected = useCallback(
    (providerId) => {
      return connections[providerId]?.connected || false;
    },
    [connections]
  );

  const isProviderLoading = useCallback(
    (providerId) => {
      return repositories[providerId]?.loading || false;
    },
    [repositories]
  );

  // Stats calculations
  const connectionStats = {
    totalConnected: connectedProviders.length,
    totalRepositories: connectedProviders.reduce(
      (sum, provider) => sum + (provider.repositories?.count || 0),
      0
    ),
    lastSync: connectedProviders.reduce((latest, provider) => {
      if (!provider.lastSync) return latest;
      const syncDate = new Date(provider.lastSync);
      return !latest || syncDate > latest ? syncDate : latest;
    }, null),
  };

  return {
    // State
    connections,
    repositories,
    connectedProviders,
    connectionStats,
    ui, // Include the entire UI state
    loading: connectionsLoading, // Alias for consistency

    // UI State
    activeCategory,
    connectionsLoading,
    connectionsError,
    refreshingProvider,
    selectedProvider,
    showConnectModal,

    // Connection Operations
    fetchConnections,
    fetchDetailedConnections,
    connectProvider,
    initiateConnection: connectProvider, // Alias for consistency
    disconnectProvider: disconnectProviderHandler,
    refreshProvider,

    // Repository Operations
    fetchProviderRepositories,
    searchProviderRepositories,

    // UI Operations
    changeCategory: changeCategoryHandler,
    setActiveCategory: changeCategoryHandler, // Alias for consistency

    // Utility functions
    getProviderConnection,
    getProviderRepositories,
    isProviderConnected,
    isProviderLoading,
  };
};

export default useGitProviders;
