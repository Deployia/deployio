import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import gitProviderService from "@/services/gitProviderService.js";

// Async Thunks
export const fetchAvailableProviders = createAsyncThunk(
  "gitProvider/fetchAvailableProviders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await gitProviderService.getAvailableProviders();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch available providers"
      );
    }
  }
);

export const fetchConnectedProviders = createAsyncThunk(
  "gitProvider/fetchConnectedProviders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await gitProviderService.getConnectedProviders();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch connected providers"
      );
    }
  }
);

export const fetchDetailedConnectionStatus = createAsyncThunk(
  "gitProvider/fetchDetailedConnectionStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await gitProviderService.getDetailedConnectionStatus();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch connection status"
      );
    }
  }
);

export const fetchRepositories = createAsyncThunk(
  "gitProvider/fetchRepositories",
  async ({ provider, page = 1, limit = 30 }, { rejectWithValue }) => {
    try {
      const response = await gitProviderService.getRepositories(provider, {
        page,
        limit,
      });
      return { provider, ...response };
    } catch (error) {
      return rejectWithValue({
        provider,
        message:
          error.response?.data?.message ||
          `Failed to fetch ${provider} repositories`,
      });
    }
  }
);

export const searchRepositories = createAsyncThunk(
  "gitProvider/searchRepositories",
  async ({ provider, query, page = 1, limit = 30 }, { rejectWithValue }) => {
    try {
      const response = await gitProviderService.searchRepositories(
        provider,
        query,
        { page, limit }
      );
      return { provider, query, ...response };
    } catch (error) {
      return rejectWithValue({
        provider,
        message:
          error.response?.data?.message ||
          `Failed to search ${provider} repositories`,
      });
    }
  }
);

export const disconnectProvider = createAsyncThunk(
  "gitProvider/disconnectProvider",
  async (provider, { rejectWithValue }) => {
    try {
      await gitProviderService.disconnectProvider(provider);
      return provider;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || `Failed to disconnect ${provider}`
      );
    }
  }
);

export const refreshProviderConnection = createAsyncThunk(
  "gitProvider/refreshProviderConnection",
  async (provider, { rejectWithValue }) => {
    try {
      const response = await gitProviderService.getProviderConfiguration(
        provider
      );
      return { provider, ...response };
    } catch (error) {
      return rejectWithValue({
        provider,
        message:
          error.response?.data?.message ||
          `Failed to refresh ${provider} connection`,
      });
    }
  }
);

// Initial state
const initialState = {
  // Connection status for all providers
  connections: {
    github: {
      connected: false,
      username: null,
      avatar: null,
      lastSync: null,
      repositories: { count: 0, private: 0, public: 0 },
    },
    gitlab: {
      connected: false,
      username: null,
      avatar: null,
      lastSync: null,
      repositories: { count: 0, private: 0, public: 0 },
    },
    bitbucket: {
      connected: false,
      username: null,
      avatar: null,
      lastSync: null,
      repositories: { count: 0, private: 0, public: 0 },
    },
    azure: {
      connected: false,
      username: null,
      avatar: null,
      lastSync: null,
      repositories: { count: 0, private: 0, public: 0 },
    },
  },

  // Repository data with pagination
  repositories: {
    github: {
      loading: false,
      data: [],
      pagination: { page: 1, totalPages: 1, totalCount: 0, hasMore: false },
      error: null,
      searchQuery: "",
      lastFetch: null,
    },
    gitlab: {
      loading: false,
      data: [],
      pagination: { page: 1, totalPages: 1, totalCount: 0, hasMore: false },
      error: null,
      searchQuery: "",
      lastFetch: null,
    },
    bitbucket: {
      loading: false,
      data: [],
      pagination: { page: 1, totalPages: 1, totalCount: 0, hasMore: false },
      error: null,
      searchQuery: "",
      lastFetch: null,
    },
    azure: {
      loading: false,
      data: [],
      pagination: { page: 1, totalPages: 1, totalCount: 0, hasMore: false },
      error: null,
      searchQuery: "",
      lastFetch: null,
    },
  },

  // Available providers configuration
  availableProviders: [
    { id: "github", name: "GitHub", enabled: true, comingSoon: false },
    { id: "gitlab", name: "GitLab", enabled: true, comingSoon: false },
    { id: "bitbucket", name: "Bitbucket", enabled: false, comingSoon: true },
    { id: "azure", name: "Azure DevOps", enabled: false, comingSoon: true },
  ],

  // UI state
  ui: {
    connectionsLoading: false,
    connectionsError: null,
    selectedProvider: null,
    showConnectModal: false,
    activeCategory: "all", // 'all', 'scm', 'cloud'
    refreshingProvider: null,
  },

  // General loading and error states
  loading: false,
  error: null,
};

// Helper functions
const updateRepositoryState = (state, provider, updates) => {
  if (state.repositories[provider]) {
    state.repositories[provider] = {
      ...state.repositories[provider],
      ...updates,
    };
  }
};

const updateConnectionState = (state, provider, updates) => {
  if (state.connections[provider]) {
    state.connections[provider] = {
      ...state.connections[provider],
      ...updates,
    };
  }
};

// Git Provider Slice
const gitProviderSlice = createSlice({
  name: "gitProvider",
  initialState,
  reducers: {
    // UI state management
    setActiveCategory: (state, action) => {
      state.ui.activeCategory = action.payload;
    },

    setSelectedProvider: (state, action) => {
      state.ui.selectedProvider = action.payload;
    },

    toggleConnectModal: (state, action) => {
      state.ui.showConnectModal =
        action.payload !== undefined
          ? action.payload
          : !state.ui.showConnectModal;
    },

    // Repository management
    clearRepositorySearch: (state, action) => {
      const { provider } = action.payload;
      updateRepositoryState(state, provider, {
        searchQuery: "",
        data: [],
        pagination: { page: 1, totalPages: 1, totalCount: 0, hasMore: false },
      });
    },

    // Reset provider data
    resetProviderData: (state, action) => {
      const { provider } = action.payload;
      updateRepositoryState(state, provider, {
        data: [],
        pagination: { page: 1, totalPages: 1, totalCount: 0, hasMore: false },
        error: null,
        searchQuery: "",
        lastFetch: null,
      });
      updateConnectionState(state, provider, {
        connected: false,
        username: null,
        avatar: null,
        lastSync: null,
        repositories: { count: 0, private: 0, public: 0 },
      });
    },

    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.ui.connectionsError = null;
    },

    clearProviderError: (state, action) => {
      const { provider } = action.payload;
      updateRepositoryState(state, provider, { error: null });
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch Available Providers
      .addCase(fetchAvailableProviders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableProviders.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.providers) {
          state.availableProviders = action.payload.providers;
        }
      })
      .addCase(fetchAvailableProviders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Connected Providers
      .addCase(fetchConnectedProviders.pending, (state) => {
        state.ui.connectionsLoading = true;
        state.ui.connectionsError = null;
      })
      .addCase(fetchConnectedProviders.fulfilled, (state, action) => {
        state.ui.connectionsLoading = false;

        // Update connection status for each provider
        if (action.payload.connections) {
          Object.entries(action.payload.connections).forEach(
            ([provider, data]) => {
              if (state.connections[provider]) {
                updateConnectionState(state, provider, {
                  connected: data.connected || false,
                  username: data.username || null,
                  avatar: data.avatar || null,
                  lastSync: data.lastSync || null,
                });
              }
            }
          );
        }
      })
      .addCase(fetchConnectedProviders.rejected, (state, action) => {
        state.ui.connectionsLoading = false;
        state.ui.connectionsError = action.payload;
      })

      // Fetch Detailed Connection Status
      .addCase(fetchDetailedConnectionStatus.pending, (state) => {
        state.ui.connectionsLoading = true;
        state.ui.connectionsError = null;
      })
      .addCase(fetchDetailedConnectionStatus.fulfilled, (state, action) => {
        state.ui.connectionsLoading = false;

        // Update detailed connection information
        if (action.payload.providers) {
          Object.entries(action.payload.providers).forEach(
            ([provider, data]) => {
              if (state.connections[provider]) {
                updateConnectionState(state, provider, {
                  connected: data.connected || false,
                  username: data.username || null,
                  avatar: data.avatar || null,
                  lastSync: data.lastSync || null,
                  repositories: data.repositories || {
                    count: 0,
                    private: 0,
                    public: 0,
                  },
                });
              }
            }
          );
        }
      })
      .addCase(fetchDetailedConnectionStatus.rejected, (state, action) => {
        state.ui.connectionsLoading = false;
        state.ui.connectionsError = action.payload;
      })

      // Fetch Repositories
      .addCase(fetchRepositories.pending, (state, action) => {
        const provider = action.meta.arg.provider;
        updateRepositoryState(state, provider, { loading: true, error: null });
      })
      .addCase(fetchRepositories.fulfilled, (state, action) => {
        const { provider, repositories, pagination } = action.payload;
        updateRepositoryState(state, provider, {
          loading: false,
          data:
            action.meta.arg.page === 1
              ? repositories
              : [...state.repositories[provider].data, ...repositories],
          pagination: {
            page: pagination.page,
            totalPages: pagination.totalPages,
            totalCount: pagination.totalCount,
            hasMore: pagination.page < pagination.totalPages,
          },
          lastFetch: new Date().toISOString(),
        });
      })
      .addCase(fetchRepositories.rejected, (state, action) => {
        const { provider, message } = action.payload;
        updateRepositoryState(state, provider, {
          loading: false,
          error: message,
        });
      })

      // Search Repositories
      .addCase(searchRepositories.pending, (state, action) => {
        const provider = action.meta.arg.provider;
        updateRepositoryState(state, provider, { loading: true, error: null });
      })
      .addCase(searchRepositories.fulfilled, (state, action) => {
        const { provider, query, repositories, pagination } = action.payload;
        updateRepositoryState(state, provider, {
          loading: false,
          data:
            action.meta.arg.page === 1
              ? repositories
              : [...state.repositories[provider].data, ...repositories],
          pagination: {
            page: pagination.page,
            totalPages: pagination.totalPages,
            totalCount: pagination.totalCount,
            hasMore: pagination.page < pagination.totalPages,
          },
          searchQuery: query,
          lastFetch: new Date().toISOString(),
        });
      })
      .addCase(searchRepositories.rejected, (state, action) => {
        const { provider, message } = action.payload;
        updateRepositoryState(state, provider, {
          loading: false,
          error: message,
        });
      })

      // Disconnect Provider
      .addCase(disconnectProvider.pending, (state, action) => {
        state.ui.refreshingProvider = action.meta.arg;
      })
      .addCase(disconnectProvider.fulfilled, (state, action) => {
        const provider = action.payload;
        state.ui.refreshingProvider = null;

        // Reset provider connection data
        updateConnectionState(state, provider, {
          connected: false,
          username: null,
          avatar: null,
          lastSync: null,
          repositories: { count: 0, private: 0, public: 0 },
        });

        // Clear repository data
        updateRepositoryState(state, provider, {
          data: [],
          pagination: { page: 1, totalPages: 1, totalCount: 0, hasMore: false },
          searchQuery: "",
          lastFetch: null,
        });
      })
      .addCase(disconnectProvider.rejected, (state, action) => {
        state.ui.refreshingProvider = null;
        state.ui.connectionsError = action.payload;
      })

      // Refresh Provider Connection
      .addCase(refreshProviderConnection.pending, (state, action) => {
        state.ui.refreshingProvider = action.meta.arg;
      })
      .addCase(refreshProviderConnection.fulfilled, (state, action) => {
        const {
          provider,
          connected,
          username,
          avatar,
          lastSync,
          repositories,
        } = action.payload;
        state.ui.refreshingProvider = null;

        updateConnectionState(state, provider, {
          connected: connected || false,
          username: username || null,
          avatar: avatar || null,
          lastSync: lastSync || null,
          repositories: repositories || { count: 0, private: 0, public: 0 },
        });
      })
      .addCase(refreshProviderConnection.rejected, (state, action) => {
        const { message } = action.payload;
        state.ui.refreshingProvider = null;
        state.ui.connectionsError = message;
      });
  },
});

// Export actions
export const {
  setActiveCategory,
  setSelectedProvider,
  toggleConnectModal,
  clearRepositorySearch,
  resetProviderData,
  clearError,
  clearProviderError,
} = gitProviderSlice.actions;

// Selectors
export const selectGitProviders = (state) => state.gitProvider;
export const selectConnections = (state) => state.gitProvider.connections;
export const selectRepositories = (state) => state.gitProvider.repositories;
export const selectAvailableProviders = (state) =>
  state.gitProvider.availableProviders;
export const selectUI = (state) => state.gitProvider.ui;

export const selectConnectedProviders = (state) => {
  return Object.entries(state.gitProvider.connections)
    .filter(([_, connection]) => connection.connected)
    .map(([provider, connection]) => ({ provider, ...connection }));
};

export const selectProviderRepositories = (provider) => (state) => {
  return (
    state.gitProvider.repositories[provider] || {
      loading: false,
      data: [],
      pagination: { page: 1, totalPages: 1, totalCount: 0, hasMore: false },
      error: null,
      searchQuery: "",
      lastFetch: null,
    }
  );
};

export const selectProviderConnection = (provider) => (state) => {
  return (
    state.gitProvider.connections[provider] || {
      connected: false,
      username: null,
      avatar: null,
      lastSync: null,
      repositories: { count: 0, private: 0, public: 0 },
    }
  );
};

export const selectEnabledProviders = (state) => {
  return state.gitProvider.availableProviders.filter(
    (provider) => provider.enabled
  );
};

export const selectComingSoonProviders = (state) => {
  return state.gitProvider.availableProviders.filter(
    (provider) => provider.comingSoon
  );
};

export default gitProviderSlice.reducer;
