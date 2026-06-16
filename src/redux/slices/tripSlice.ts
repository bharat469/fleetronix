/**
 * tripSlice.ts
 *
 * Redux Toolkit slice for managing the active trip lifecycle.
 * Covers: trip data, OTP verification, lifecycle status, live location, driver info.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TripLifecycle =
  | 'idle'
  | 'otp_pending'
  | 'otp_verified'
  | 'starting'
  | 'started'
  | 'in_transit'
  | 'near_destination'
  | 'delivered';

export interface LiveLocation {
  latitude: number;
  longitude: number;
  timestamp?: string;
}

export interface ActiveTripState {
  // Trip data
  tripId: string | null;
  loadNumber: string | null;
  tripData: Record<string, any> | null;

  // Driver info
  driverName: string | null;
  driverPhoto: string | null;
  driverMobile: string | null;

  // Route details
  sourceLatitude: number | null;
  sourceLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;

  // OTP state
  otpVerified: boolean;
  otpError: string | null;

  // Lifecycle
  lifecycle: TripLifecycle;

  // Live location
  liveLocation: LiveLocation | null;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: ActiveTripState = {
  tripId: null,
  loadNumber: null,
  tripData: null,
  driverName: null,
  driverPhoto: null,
  driverMobile: null,
  sourceLatitude: null,
  sourceLongitude: null,
  destinationLatitude: null,
  destinationLongitude: null,
  otpVerified: false,
  otpError: null,
  lifecycle: 'idle',
  liveLocation: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    setActiveTripData: (state, action: PayloadAction<Record<string, any>>) => {
      const d = action.payload;
      if (d && typeof d === 'object') {
        const id = d.trip_id ?? d.id;
        if (id) {
          state.tripId = id;
        }
      }
      // Removed saving other fields as per request
    },

    setOtpVerified: (state) => {
      state.otpVerified = true;
      state.otpError    = null;
      state.lifecycle   = 'otp_verified';
    },

    setOtpError: (state, action: PayloadAction<string>) => {
      state.otpError  = action.payload;
      state.lifecycle = 'otp_pending';
    },

    clearOtpError: (state) => {
      state.otpError = null;
    },

    setLifecycle: (state, action: PayloadAction<TripLifecycle>) => {
      state.lifecycle = action.payload;
    },

    setLiveLocation: (state, action: PayloadAction<LiveLocation>) => {
      state.liveLocation = action.payload;
    },

    setTripId: (state, action: PayloadAction<string>) => {
      state.tripId = action.payload;
    },

    resetTrip: () => initialState,
  },
});

export const {
  setActiveTripData,
  setOtpVerified,
  setOtpError,
  clearOtpError,
  setLifecycle,
  setLiveLocation,
  setTripId,
  resetTrip,
} = tripSlice.actions;

export default tripSlice.reducer;
