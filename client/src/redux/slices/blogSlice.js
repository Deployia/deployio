import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@utils/api";

// Async thunks for API calls
export const fetchAllBlogs = createAsyncThunk(
  "blog/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/blogs");
      return response.data.data; // Extract data from the success response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch blogs"
      );
    }
  }
);

export const fetchBlogsByCategory = createAsyncThunk(
  "blog/fetchByCategory",
  async (category, { rejectWithValue }) => {
    try {
      const response = await api.get(`/blogs/category/${category}`);
      return response.data.data; // Extract data from the success response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch blogs by category"
      );
    }
  }
);

export const fetchBlogBySlug = createAsyncThunk(
  "blog/fetchBySlug",
  async ({ category, slug }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/blogs/${category}/${slug}`);
      return response.data.data; // Extract data from the success response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch blog post"
      );
    }
  }
);

export const searchBlogs = createAsyncThunk(
  "blog/search",
  async (searchTerm, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/blogs/search?q=${encodeURIComponent(searchTerm)}`
      );
      return response.data.data; // Extract data from the success response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search blogs"
      );
    }
  }
);

export const fetchFeaturedBlogs = createAsyncThunk(
  "blog/fetchFeatured",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/blogs/featured");
      return response.data.data; // Extract data from the success response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch featured blogs"
      );
    }
  }
);

export const fetchPopularBlogs = createAsyncThunk(
  "blog/fetchPopular",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/blogs/popular");
      return response.data.data; // Extract data from the success response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch popular blogs"
      );
    }
  }
);

export const fetchRecentBlogs = createAsyncThunk(
  "blog/fetchRecent",
  async (limit = 5, { rejectWithValue }) => {
    try {
      const response = await api.get(`/blogs/recent?limit=${limit}`);
      return response.data.data; // Extract data from the success response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch recent blogs"
      );
    }
  }
);

export const fetchBlogCategories = createAsyncThunk(
  "blog/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/blogs/categories");
      return response.data.data; // Extract data from the success response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch blog categories"
      );
    }
  }
);

export const fetchBlogStats = createAsyncThunk(
  "blog/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/blogs/stats");
      return response.data.data; // Extract data from the success response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch blog stats"
      );
    }
  }
);

const initialState = {
  blogs: [],
  currentBlog: null,
  featuredBlogs: [],
  popularBlogs: [],
  recentBlogs: [],
  categories: [],
  searchResults: [],
  stats: null,
  loading: {
    blogs: false,
    currentBlog: false,
    featuredBlogs: false,
    popularBlogs: false,
    recentBlogs: false,
    categories: false,
    search: false,
    stats: false,
  },
  error: null,
  searchTerm: "",
  currentCategory: null,
};

const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {
    clearCurrentBlog: (state) => {
      state.currentBlog = null;
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchTerm = "";
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setCurrentCategory: (state, action) => {
      state.currentCategory = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all blogs
      .addCase(fetchAllBlogs.pending, (state) => {
        state.loading.blogs = true;
        state.error = null;
      })
      .addCase(fetchAllBlogs.fulfilled, (state, action) => {
        state.loading.blogs = false;
        // Backend returns { blogs, stats, pagination }
        state.blogs = action.payload.blogs || action.payload;
        if (action.payload.stats) state.stats = action.payload.stats;
      })
      .addCase(fetchAllBlogs.rejected, (state, action) => {
        state.loading.blogs = false;
        state.error = action.payload;
      }) // Fetch blogs by category
      .addCase(fetchBlogsByCategory.pending, (state) => {
        state.loading.blogs = true;
        state.error = null;
      })
      .addCase(fetchBlogsByCategory.fulfilled, (state, action) => {
        state.loading.blogs = false;
        // Backend returns { blogs, category, pagination }
        state.blogs = action.payload.blogs || action.payload;
        if (action.payload.category)
          state.currentCategory = action.payload.category;
      })
      .addCase(fetchBlogsByCategory.rejected, (state, action) => {
        state.loading.blogs = false;
        state.error = action.payload;
      }) // Fetch blog by slug
      .addCase(fetchBlogBySlug.pending, (state) => {
        state.loading.blog = true;
        state.error = null;
        state.currentBlog = null; // Clear current blog when fetching new one
      })
      .addCase(fetchBlogBySlug.fulfilled, (state, action) => {
        state.loading.blog = false;
        // Backend returns { blog, relatedPosts }
        state.currentBlog = action.payload.blog || action.payload;
      })
      .addCase(fetchBlogBySlug.rejected, (state, action) => {
        state.loading.blog = false;
        state.error = action.payload;
      }) // Search blogs
      .addCase(searchBlogs.pending, (state) => {
        state.loading.search = true;
        state.error = null;
      })
      .addCase(searchBlogs.fulfilled, (state, action) => {
        state.loading.search = false;
        // Backend returns { blogs, query, filters, pagination }
        state.searchResults = action.payload.blogs || action.payload;
        if (action.payload.query) state.searchTerm = action.payload.query;
      })
      .addCase(searchBlogs.rejected, (state, action) => {
        state.loading.search = false;
        state.error = action.payload;
      }) // Fetch featured blogs
      .addCase(fetchFeaturedBlogs.pending, (state) => {
        state.loading.featured = true;
        state.error = null;
      })
      .addCase(fetchFeaturedBlogs.fulfilled, (state, action) => {
        state.loading.featured = false;
        state.featuredBlogs = action.payload;
      })
      .addCase(fetchFeaturedBlogs.rejected, (state, action) => {
        state.loading.featured = false;
        state.error = action.payload;
      })

      // Fetch popular blogs
      .addCase(fetchPopularBlogs.pending, (state) => {
        state.loading.popular = true;
        state.error = null;
      })
      .addCase(fetchPopularBlogs.fulfilled, (state, action) => {
        state.loading.popular = false;
        state.popularBlogs = action.payload;
      })
      .addCase(fetchPopularBlogs.rejected, (state, action) => {
        state.loading.popular = false;
        state.error = action.payload;
      })

      // Fetch recent blogs
      .addCase(fetchRecentBlogs.pending, (state) => {
        state.loading.recent = true;
        state.error = null;
      })
      .addCase(fetchRecentBlogs.fulfilled, (state, action) => {
        state.loading.recent = false;
        state.recentBlogs = action.payload;
      })
      .addCase(fetchRecentBlogs.rejected, (state, action) => {
        state.loading.recent = false;
        state.error = action.payload;
      })

      // Fetch blog categories
      .addCase(fetchBlogCategories.pending, (state) => {
        state.loading.categories = true;
        state.error = null;
      })
      .addCase(fetchBlogCategories.fulfilled, (state, action) => {
        state.loading.categories = false;
        state.categories = action.payload;
      })
      .addCase(fetchBlogCategories.rejected, (state, action) => {
        state.loading.categories = false;
        state.error = action.payload;
      })

      // Fetch blog stats
      .addCase(fetchBlogStats.pending, (state) => {
        state.loading.stats = true;
        state.error = null;
      })
      .addCase(fetchBlogStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
      })
      .addCase(fetchBlogStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCurrentBlog,
  clearSearchResults,
  setSearchTerm,
  setCurrentCategory,
  clearError,
} = blogSlice.actions;

export default blogSlice.reducer;
