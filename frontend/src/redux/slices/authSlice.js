import { createSlice, createAsyncThunk, isRejectedWithValue } from "@reduxjs/toolkit";
import axios from "axios";

//Retrieve user info and token from localStorage if available

const userFromStorage = localStorage.getItem("userInfo")
? JSON.parse(localStorage.getItem("userInfo")): null


//Check for an existing guest get ID in the localStorage

const initianlGuestId = localStorage.getItem("guestId") || `guest_${new Date().getTime()}`;
localStorage.setItem("guestId",initianlGuestId)

//Initial state
const initialState ={
    user : userFromStorage,
    guestId: initianlGuestId,
    loading : false,
    error : null
}

// Async thunk User login
 export const loginUser = createAsyncThunk("auth/loginUser",async (userData,{isRejectedWithValue})=>{
    try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/login`,
            userData
        );
        localStorage.setItem("userInfo", JSON.stringify(response.data.user))
        localStorage.setItem("userToken",response.data.token);

        return response.data.user; // Return the user object from the response
    } catch (error) {
        return isRejectedWithValue(error.response.data)
    }
 }) 

 // Async thunk User Registration
 export const registerUser = createAsyncThunk("auth/registerUser",async (userData,{isRejectedWithValue})=>{
    try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/register`,
            userData
        );
        localStorage.setItem("userInfo", JSON.stringify(response.data.user))
        localStorage.setItem("userToken",response.data.token);

        return response.data.user; // Return the user object from the response
    } catch (error) {
        return isRejectedWithValue(error.response.data)
    }
 }) 

 //Slice
 const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.guestId = `guest_${new Date().getTime()}`;
      localStorage.removeItem("userInfo");
      localStorage.removeItem("userToken");
      localStorage.setItem("guestId", state.guestId);
    },
    generateNewGuestId: (state) => {
      state.guestId = `guest_${new Date().getTime()}`;
      localStorage.setItem("guestId", state.guestId);
    }
  },
  extraReducers: (builder) => {
    // LOGIN
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload; // store user info
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Login failed";
    });

    // REGISTER
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload; // store user info
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Registration failed";
    });
  }
});

export const { logout,generateNewGuestId} = authSlice.actions;
export default authSlice.reducer