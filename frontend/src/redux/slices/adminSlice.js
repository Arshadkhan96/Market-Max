import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

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

// Helper function to handle API requests with token
const makeAuthorizedRequest = async (url, method = 'GET', data = null) => {
  const token = localStorage.getItem("userToken");
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const config = {
    method,
    url: `${import.meta.env.VITE_BACKEND_URL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data
  };

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

// Delete a user
export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      return await makeAuthorizedRequest(
        `/api/admin/users/${userId}`,
        'DELETE'
      );
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
  reducers: {},
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
        state.error = action.error.message;
      })

      // Add user
      .addCase(addUser.fulfilled, (state, action) => {
        state.users.push(action.payload.user); //add new user to the state
      })

      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const index = state.users.findIndex((user) => user._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
      })

      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((user) => user._id !== action.payload);
      });
  },
});

export default adminSlice.reducer;
