

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ Safe: Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const storedCart = localStorage.getItem("cart");
    if (!storedCart || storedCart === "undefined" || storedCart === "null") {
      return { products: [] };
    }
    return JSON.parse(storedCart);
  } catch (err) {
    console.error("Error parsing cart from storage:", err);
    return { products: [] };
  }
};

// ✅ Safe: Save cart to localStorage
const saveCartToStorage = (cart) => {
  if (!cart) return;
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (err) {
    console.error("Error saving cart to storage:", err);
  }
};

// --------------------- ASYNC THUNKS ---------------------

// Fetch cart
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async ({ userId, guestId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        { params: { userId, guestId } }
      );
      return response.data; // ✅ cart object directly
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to fetch cart" });
    }
  }
);

// Add item
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, quantity, size, color, guestId, userId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
        productId,
        quantity,
        size,
        color,
        guestId,
        userId,
      });
      return response.data; // ✅ cart object directly
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to add to cart" });
    }
  }
);

// Update quantity
export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async ({ productId, quantity, guestId, userId, size, color }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
        productId,
        quantity,
        guestId,
        userId,
        size,
        color,
      });
      return response.data; // ✅ cart object directly
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to update quantity" });
    }
  }
);

// Remove item
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async ({ productId, guestId, userId, size, color }, { rejectWithValue, getState }) => {
    try {
      if (!productId) {
        console.error('Product ID is required');
        return rejectWithValue({ message: 'Product ID is required' });
      }

      const token = localStorage.getItem("userToken");
      const state = getState();
      const currentUserId = userId || (state.auth?.user?._id);
      
      // Ensure we have either a user ID or guest ID
      if (!currentUserId && !guestId) {
        console.error('Cannot remove item: No user ID or guest ID available');
        return rejectWithValue({ message: 'User not authenticated' });
      }
      
      // Build the URL with productId in the path and other params as query parameters
      const url = new URL(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${encodeURIComponent(productId)}`);
      
      // Add query parameters
      const params = new URLSearchParams();
      if (currentUserId) params.append('userId', currentUserId);
      if (guestId) params.append('guestId', guestId);
      if (size) params.append('size', size);
      if (color) params.append('color', color);
      
      // Add query parameters to URL
      url.search = params.toString();
      
      const config = {
        headers: {}
      };
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log('Sending DELETE request to:', {
        url,
        headers: config.headers
      });

      const response = await axios.delete(url, config);
      
      console.log('Remove from cart response:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error removing item from cart:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
          headers: error.config?.headers
        }
      });
      
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to remove item from cart",
        status: error.response?.status,
        error: error.message
      });
    }
  }
);


// Merge guest cart into user cart
export const mergeCart = createAsyncThunk(
  "cart/mergeCart",
  async ({ guestId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart/merge`,
        { guestId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return response.data; // ✅ cart object directly
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to merge cart" });
    }
  }
);

// --------------------- SLICE ---------------------

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: loadCartFromStorage(),
    loading: false,
    error: null,
  },
  reducers: {
    clearCart: (state) => {
      state.cart = { products: [] };
      localStorage.removeItem("cart");
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload; // ✅ FIXED
        saveCartToStorage(state.cart);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch cart";
      })

      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload; // ✅ FIXED
        saveCartToStorage(state.cart);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to add to cart";
      })

      // Update quantity
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload; // ✅ FIXED
        saveCartToStorage(state.cart);
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update item quantity";
      })

      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload; // ✅ FIXED
        saveCartToStorage(state.cart);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to remove item";
      })

      // Merge cart
      .addCase(mergeCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(mergeCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload; // ✅ FIXED
        saveCartToStorage(state.cart);
      })
      .addCase(mergeCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to merge cart";
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
