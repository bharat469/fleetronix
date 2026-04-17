import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  userToken: string | null;
  refreshToken: string | null;
  driverId: string | null;
  purpose: string | null;
  isRegistered: boolean;
}

const initialState: AuthState = {
  userToken: null,
  refreshToken: null,
  driverId: null,
  purpose: null,
  isRegistered: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string; driverId: string; purpose: string }>) => {
      state.userToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.driverId = action.payload.driverId;
      state.purpose = action.payload.purpose;
    },
    setPurpose: (state, action: PayloadAction<string>) => {
      state.purpose = action.payload;
    },
    logout: (state) => {
      state.userToken = null;
      state.refreshToken = null;
      state.driverId = null;
      state.purpose = null;
    },
  },
});

export const { setTokens, logout, setPurpose } = authSlice.actions;
export default authSlice.reducer;
