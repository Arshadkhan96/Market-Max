// adminSlice.js - Fixed version
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Helper function to handle API requests with token
const makeAuthorizedRequest = async (url, method = 'GET', data = null) => {
  const token = localStorage.getItem("userToken");
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
   // Don't include Content-Type for DELETE requests without a body
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  // Only include Content-Type if there's data to send
  if (method !== 'GET' && method !== 'DELETE' && data) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    url: `${import.meta.env.VITE_BACKEND_URL}${url}`,
    headers: headers,
    // Don't include data for GET and DELETE requests if it's null/undefined
    ...(data && { data })
  };


  // const config = {
  //   method,
  //   url: `${import.meta.env.VITE_BACKEND_URL}${url}`,
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${token}`
  //   },
  //   data
  // };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    // Handle token expiration
    if (error.response?.status === 401 && error.response?.data?.isTokenExpired) {
      // Clear expired token and user data
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      window.location.href = '/login?session=expired';
    }
    throw error;
  }
};

// Fetch all users (Admin only)
export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      return await makeAuthorizedRequest('/api/admin/users');
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch users',
        status: error.response?.status || 500
      });
    }
  }
);

// Add a new user
export const addUser = createAsyncThunk(
  "admin/addUser",
  async (userData, { rejectWithValue }) => {
    try {
      return await makeAuthorizedRequest('/api/admin/users', 'POST', userData);
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to add user',
        status: error.response?.status || 500
      });
    }
  }
);

// Update user info
export const updateUser = createAsyncThunk(
  "admin/updateUser",
  async ({ id, name, email, role }, { rejectWithValue }) => {
    try {
      return await makeAuthorizedRequest(
        `/api/admin/users/${id}`,
        'PUT',
        { name, email, role }
      );
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to update user',
        status: error.response?.status || 500
      });
    }
  }
);

// Delete a user - FIXED VERSION
export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await makeAuthorizedRequest(
        `/api/admin/users/${userId}`,
        'DELETE'
      );
      
      // Return the userId from the response object
      return response.userId;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to delete user',
        status: error.response?.status || 500
      });
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Add a reducer to clear errors
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add user
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload.user);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload;
        const index = state.users.findIndex((user) => user._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        // Filter out the deleted user using the userId returned from the thunk
        state.users = state.users.filter((user) => user._id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;