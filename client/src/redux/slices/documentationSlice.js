import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@utils/api";

// Initial State
const initialState = {
  // Documentation data
  documents: [],
  currentDocument: null,
  featuredDocuments: [],
  popularDocuments: [],
  stats: null,
  categories: [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "📚",
      description: "Quick start guides and installation instructions",
    },
    {
      id: "products",
      title: "Products",
      icon: "🛠️",
      description: "Our comprehensive suite of deployment tools",
    },
    {
      id: "downloads",
      title: "Downloads",
      icon: "📦",
      description: "CLI tools and SDKs",
    },
    {
      id: "api",
      title: "API Reference",
      icon: "🔌",
      description: "Complete API documentation",
    },
    {
      id: "guides",
      title: "Guides",
      icon: "🎯",
      description: "Best practices and tutorials",
    },
    {
      id: "security",
      title: "Security",
      icon: "🛡️",
      description: "Security best practices and compliance",
    },
  ],
  searchResults: [],
  searchQuery: "",

  // Navigation state
  breadcrumbs: [],
  sidebarOpen: true,
  currentCategory: null,

  // Loading states
  loading: {
    documents: false,
    document: false,
    featured: false,
    popular: false,
    stats: false,
    search: false,
    create: false,
    update: false,
    delete: false,
    sync: false,
  },

  // Error states
  error: {
    documents: null,
    document: null,
    featured: null,
    popular: null,
    stats: null,
    search: null,
    create: null,
    update: null,
    delete: null,
    sync: null,
  },

  // Pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },

  // Cache
  cache: {
    lastFetch: null,
    ttl: 5 * 60 * 1000, // 5 minutes
  },
};

// Async Thunks
export const fetchDocuments = createAsyncThunk(
  "documentation/fetchDocuments",
  async (
    { category, page = 1, limit = 10, search, tag } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(category && { category }),
        ...(search && { search }),
        ...(tag && { tag }),
      });

      const response = await api.get(`/external/docs?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch documents"
      );
    }
  }
);

export const fetchDocument = createAsyncThunk(
  "documentation/fetchDocument",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/external/docs/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch document"
      );
    }
  }
);

export const fetchDocumentBySlug = createAsyncThunk(
  "documentation/fetchDocumentBySlug",
  async ({ category, slug }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/external/docs/${category}/${slug}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch document"
      );
    }
  }
);

export const fetchDocumentsByCategory = createAsyncThunk(
  "documentation/fetchDocumentsByCategory",
  async ({ category, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await api.get(
        `/external/docs/category/${category}?${params}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch documents by category"
      );
    }
  }
);

export const fetchFeaturedDocuments = createAsyncThunk(
  "documentation/fetchFeaturedDocuments",
  async (limit = 6, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await api.get(`/external/docs/featured?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch featured documents"
      );
    }
  }
);

export const fetchPopularDocuments = createAsyncThunk(
  "documentation/fetchPopularDocuments",
  async (limit = 10, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await api.get(`/external/docs/popular?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch popular documents"
      );
    }
  }
);

export const fetchDocumentationStats = createAsyncThunk(
  "documentation/fetchDocumentationStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/external/docs/stats");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch documentation stats"
      );
    }
  }
);

export const searchDocuments = createAsyncThunk(
  "documentation/searchDocuments",
  async ({ query, category, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
        ...(category && { category }),
      });

      const response = await api.get(`/external/docs/search?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Search failed");
    }
  }
);

export const syncDocuments = createAsyncThunk(
  "documentation/syncDocuments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/external/docs/sync");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to sync documents"
      );
    }
  }
);

export const createDocument = createAsyncThunk(
  "documentation/createDocument",
  async (documentData, { rejectWithValue }) => {
    try {
      const response = await api.post("/external/docs", documentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create document"
      );
    }
  }
);

export const updateDocument = createAsyncThunk(
  "documentation/updateDocument",
  async ({ id, ...documentData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/external/docs/${id}`, documentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update document"
      );
    }
  }
);

export const deleteDocument = createAsyncThunk(
  "documentation/deleteDocument",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/external/docs/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete document"
      );
    }
  }
);

// Mark Document as Helpful
export const markDocumentHelpful = createAsyncThunk(
  "documentation/markHelpful",
  async ({ slug, category }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/external/docs/${slug}/helpful`, {
        category,
      });
      return {
        slug,
        category,
        helpfulCount: response.data.data.helpfulCount,
        notHelpfulCount: response.data.data.notHelpfulCount,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark document as helpful"
      );
    }
  }
);

// Mark Document as Not Helpful
export const markDocumentNotHelpful = createAsyncThunk(
  "documentation/markNotHelpful",
  async ({ slug, category }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/external/docs/${slug}/not-helpful`, {
        category,
      });
      return {
        slug,
        category,
        helpfulCount: response.data.data.helpfulCount,
        notHelpfulCount: response.data.data.notHelpfulCount,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to mark document as not helpful"
      );
    }
  }
);

// Documentation Slice
const documentationSlice = createSlice({
  name: "documentation",
  initialState,
  reducers: {
    // UI Actions
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },

    setCurrentCategory: (state, action) => {
      state.currentCategory = action.payload;
    },

    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },

    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = "";
    },

    setBreadcrumbs: (state, action) => {
      state.breadcrumbs = action.payload;
    },

    clearCurrentDocument: (state) => {
      state.currentDocument = null;
    },

    // Error handling
    clearError: (state, action) => {
      const errorType = action.payload;
      if (errorType && state.error[errorType]) {
        state.error[errorType] = null;
      } else {
        // Clear all errors
        Object.keys(state.error).forEach((key) => {
          state.error[key] = null;
        });
      }
    },

    // Cache management
    invalidateCache: (state) => {
      state.cache.lastFetch = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Documents
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading.documents = true;
        state.error.documents = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading.documents = false;
        const { docs, stats, pagination } = action.payload.data || {};
        state.documents = docs || [];
        if (stats) {
          state.stats = stats;
        }
        state.pagination = {
          currentPage: pagination?.page || 1,
          totalPages:
            Math.ceil((pagination?.total || 0) / (pagination?.limit || 10)) ||
            1,
          totalItems: pagination?.total || 0,
          itemsPerPage: pagination?.limit || 10,
        };
        state.cache.lastFetch = Date.now();
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading.documents = false;
        state.error.documents = action.payload;
      });

    // Fetch Document
    builder
      .addCase(fetchDocument.pending, (state) => {
        state.loading.document = true;
        state.error.document = null;
      })
      .addCase(fetchDocument.fulfilled, (state, action) => {
        state.loading.document = false;
        state.currentDocument = action.payload.data;
      })
      .addCase(fetchDocument.rejected, (state, action) => {
        state.loading.document = false;
        state.error.document = action.payload;
      }); // Fetch Document By Slug
    builder
      .addCase(fetchDocumentBySlug.pending, (state) => {
        state.loading.document = true;
        state.error.document = null;
        // Clear current document to prevent showing stale content
        state.currentDocument = null;
      })
      .addCase(fetchDocumentBySlug.fulfilled, (state, action) => {
        state.loading.document = false;
        state.currentDocument = action.payload.data;
      })
      .addCase(fetchDocumentBySlug.rejected, (state, action) => {
        state.loading.document = false;
        state.error.document = action.payload;
        state.currentDocument = null;
      }); // Search Documents
    builder
      .addCase(searchDocuments.pending, (state) => {
        state.loading.search = true;
        state.error.search = null;
      })
      .addCase(searchDocuments.fulfilled, (state, action) => {
        state.loading.search = false;
        state.searchResults = action.payload.data || [];
      })
      .addCase(searchDocuments.rejected, (state, action) => {
        state.loading.search = false;
        state.error.search = action.payload;
        state.searchResults = [];
      });

    // Fetch Documents By Category
    builder
      .addCase(fetchDocumentsByCategory.pending, (state) => {
        state.loading.documents = true;
        state.error.documents = null;
      })
      .addCase(fetchDocumentsByCategory.fulfilled, (state, action) => {
        state.loading.documents = false;
        state.documents = action.payload.data || [];
      })
      .addCase(fetchDocumentsByCategory.rejected, (state, action) => {
        state.loading.documents = false;
        state.error.documents = action.payload;
      });

    // Fetch Featured Documents
    builder
      .addCase(fetchFeaturedDocuments.pending, (state) => {
        state.loading.featured = true;
        state.error.featured = null;
      })
      .addCase(fetchFeaturedDocuments.fulfilled, (state, action) => {
        state.loading.featured = false;
        state.featuredDocuments = action.payload.data || [];
      })
      .addCase(fetchFeaturedDocuments.rejected, (state, action) => {
        state.loading.featured = false;
        state.error.featured = action.payload;
      });

    // Fetch Popular Documents
    builder
      .addCase(fetchPopularDocuments.pending, (state) => {
        state.loading.popular = true;
        state.error.popular = null;
      })
      .addCase(fetchPopularDocuments.fulfilled, (state, action) => {
        state.loading.popular = false;
        state.popularDocuments = action.payload.data || [];
      })
      .addCase(fetchPopularDocuments.rejected, (state, action) => {
        state.loading.popular = false;
        state.error.popular = action.payload;
      });

    // Fetch Documentation Stats
    builder
      .addCase(fetchDocumentationStats.pending, (state) => {
        state.loading.stats = true;
        state.error.stats = null;
      })
      .addCase(fetchDocumentationStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload.data || null;
      })
      .addCase(fetchDocumentationStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error.stats = action.payload;
      });

    // Sync Documents
    builder
      .addCase(syncDocuments.pending, (state) => {
        state.loading.sync = true;
        state.error.sync = null;
      })
      .addCase(syncDocuments.fulfilled, (state, _action) => {
        state.loading.sync = false;
        // Optionally refresh documents after sync
        state.cache.lastFetch = null;
      })
      .addCase(syncDocuments.rejected, (state, action) => {
        state.loading.sync = false;
        state.error.sync = action.payload;
      });

    // Create Document
    builder
      .addCase(createDocument.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.loading.create = false;
        const newDoc = action.payload.data;
        state.documents.unshift(newDoc);
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload;
      });

    // Update Document
    builder
      .addCase(updateDocument.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(updateDocument.fulfilled, (state, action) => {
        state.loading.update = false;
        const updatedDoc = action.payload.data;
        const index = state.documents.findIndex(
          (doc) => doc._id === updatedDoc._id
        );
        if (index !== -1) {
          state.documents[index] = updatedDoc;
        }
        if (state.currentDocument?._id === updatedDoc._id) {
          state.currentDocument = updatedDoc;
        }
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
      });

    // Delete Document
    builder
      .addCase(deleteDocument.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.documents = state.documents.filter(
          (doc) => doc._id !== action.payload
        );
        if (state.currentDocument?._id === action.payload) {
          state.currentDocument = null;
        }
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload;
      }); // Mark Document as Helpful
    builder
      .addCase(markDocumentHelpful.pending, (state) => {
        state.loading.document = true;
        state.error.document = null;
      })
      .addCase(markDocumentHelpful.fulfilled, (state, action) => {
        state.loading.document = false;
        const { slug, helpfulCount, notHelpfulCount } = action.payload;
        const index = state.documents.findIndex((doc) => doc.slug === slug);
        if (index !== -1) {
          state.documents[index].helpfulCount = helpfulCount;
          state.documents[index].notHelpfulCount = notHelpfulCount;
        }
        if (state.currentDocument?.slug === slug) {
          state.currentDocument.helpfulCount = helpfulCount;
          state.currentDocument.notHelpfulCount = notHelpfulCount;
        }
      })
      .addCase(markDocumentHelpful.rejected, (state, action) => {
        state.loading.document = false;
        state.error.document = action.payload;
      });

    // Mark Document as Not Helpful
    builder
      .addCase(markDocumentNotHelpful.pending, (state) => {
        state.loading.document = true;
        state.error.document = null;
      })
      .addCase(markDocumentNotHelpful.fulfilled, (state, action) => {
        state.loading.document = false;
        const { slug, helpfulCount, notHelpfulCount } = action.payload;
        const index = state.documents.findIndex((doc) => doc.slug === slug);
        if (index !== -1) {
          state.documents[index].helpfulCount = helpfulCount;
          state.documents[index].notHelpfulCount = notHelpfulCount;
        }
        if (state.currentDocument?.slug === slug) {
          state.currentDocument.helpfulCount = helpfulCount;
          state.currentDocument.notHelpfulCount = notHelpfulCount;
        }
      })
      .addCase(markDocumentNotHelpful.rejected, (state, action) => {
        state.loading.document = false;
        state.error.document = action.payload;
      });
  },
});

// Actions
export const {
  setSidebarOpen,
  setCurrentCategory,
  setSearchQuery,
  clearSearchResults,
  setBreadcrumbs,
  clearCurrentDocument,
  clearError,
  invalidateCache,
} = documentationSlice.actions;

// Selectors
export const selectDocuments = (state) => state.documentation.documents;
export const selectCurrentDocument = (state) =>
  state.documentation.currentDocument;
export const selectFeaturedDocuments = (state) =>
  state.documentation.featuredDocuments;
export const selectPopularDocuments = (state) =>
  state.documentation.popularDocuments;
export const selectDocumentationStats = (state) => state.documentation.stats;
export const selectCategories = (state) => state.documentation.categories;
export const selectSearchResults = (state) => state.documentation.searchResults;
export const selectSearchQuery = (state) => state.documentation.searchQuery;
export const selectBreadcrumbs = (state) => state.documentation.breadcrumbs;
export const selectSidebarOpen = (state) => state.documentation.sidebarOpen;
export const selectCurrentCategory = (state) =>
  state.documentation.currentCategory;
export const selectDocumentationLoading = (state) =>
  state.documentation.loading;
export const selectDocumentationError = (state) => state.documentation.error;
export const selectPagination = (state) => state.documentation.pagination;

// Complex selectors
export const selectDocumentsByCategory = (state, category) =>
  state.documentation.documents.filter((doc) => doc.category === category);

export const selectIsLoading = (state) =>
  Object.values(state.documentation.loading).some((loading) => loading);

export const selectHasError = (state) =>
  Object.values(state.documentation.error).some((error) => error !== null);

export const selectCacheExpired = (state) => {
  const { lastFetch, ttl } = state.documentation.cache;
  return !lastFetch || Date.now() - lastFetch > ttl;
};

export default documentationSlice.reducer;
