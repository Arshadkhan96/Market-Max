// redux/slices/productsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ Fetch products by filters (with cache-buster) — unchanged
export const fetchProductsByFilters = createAsyncThunk(
  "products/fetchByFilters",
  async (filters, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, value);
        }
      });
      query.append("_", Date.now()); // cache buster
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/products?${query.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// STEP 1: Thunk now takes id DIRECTLY (not { id })
export const fetchProductDetails = createAsyncThunk(
  "products/fetchProductDetails",
  async (id, { rejectWithValue }) => {
    try {
      // Optional: a tiny client guard here as well (harmless)
      if (!id || typeof id !== "string" || id.length !== 24) {
        return rejectWithValue("Invalid product id");
      }
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/products/${id}?_=${Date.now()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// STEP 2: Same change for similar products
export const fetchSimilarProducts = createAsyncThunk(
  "products/fetchSimilarProducts",
  async (id, { rejectWithValue }) => {
    try {
      if (!id || typeof id !== "string" || id.length !== 24) {
        return rejectWithValue("Invalid product id");
      }
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/products/similar/${id}?_=${Date.now()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    selectedProduct: null,
    similarProducts: [],
    loading: false,
    error: null,

    similarLoading: false,
    similarError: null,

    filters: {
      category: "",
      size: "",
      color: "",
      gender: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "",
      search: "",
      collection: "",
      material: "",
    },
    metadata: {
      count: 0,
      totalProducts: 0,
      totalPages: 0,
      currentPage: 1,
      priceRange: { minPrice: 0, maxPrice: 0 },
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      Object.keys(state.filters).forEach((key) => (state.filters[key] = ""));
    },
  },
  extraReducers: (builder) => {
    builder
      // Products by filter
      .addCase(fetchProductsByFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.metadata = {
          count: action.payload.count || 0,
          totalProducts: action.payload.totalProducts || 0,
          totalPages: action.payload.totalPages || 0,
          currentPage: action.payload.currentPage || 1,
          priceRange: action.payload.priceRange || { minPrice: 0, maxPrice: 0 },
        };
      })
      .addCase(fetchProductsByFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.products = [];
      })

      // Single product
      .addCase(fetchProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedProduct = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload || null;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch product";
      })

      // Similar products
      .addCase(fetchSimilarProducts.pending, (state) => {
        state.similarLoading = true;
        state.similarError = null;
      })
      .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
        state.similarLoading = false;
        state.similarProducts = action.payload || [];
      })
      .addCase(fetchSimilarProducts.rejected, (state, action) => {
        state.similarLoading = false;
        state.similarError = action.payload || "Failed to fetch similar products";
      });
  },
});

export const { setFilters, clearFilters } = productSlice.actions;
export default productSlice.reducer;
