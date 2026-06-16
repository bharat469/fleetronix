import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Asset } from 'react-native-image-picker';
import { VehicleType, StateData } from '../../api/masterApi';

interface RegistrationState {
  selectedTrucks: VehicleType[];
  selectedStates: StateData[];
  licenseImage: Asset | null;
  adharImage: Asset | null;
  profileImage: Asset | null;
}

const initialState: RegistrationState = {
  selectedTrucks: [],
  selectedStates: [],
  licenseImage: null,
  adharImage: null,
  profileImage: null,
};

const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    // Truck actions
    setSelectedTrucks: (state, action: PayloadAction<VehicleType[]>) => {
      state.selectedTrucks = action.payload;
    },
    toggleTruckSelection: (state, action: PayloadAction<VehicleType>) => {
      const index = state.selectedTrucks.findIndex((truck) => truck.id === action.payload.id);
      if (index !== -1) {
        state.selectedTrucks.splice(index, 1);
      } else {
        state.selectedTrucks.push(action.payload);
      }
    },
    // State actions
    setSelectedStates: (state, action: PayloadAction<StateData[]>) => {
      state.selectedStates = action.payload;
    },
    toggleStateSelection: (state, action: PayloadAction<StateData>) => {
      const index = state.selectedStates.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.selectedStates.splice(index, 1);
      } else {
        state.selectedStates.push(action.payload);
      }
    },
    setLicenseImage: (state, action: PayloadAction<Asset | null>) => {
      state.licenseImage = action.payload;
    },
    setAdharImage: (state, action: PayloadAction<Asset | null>) => {
      state.adharImage = action.payload;
    },
    setProfileImage: (state, action: PayloadAction<Asset | null>) => {
      state.profileImage = action.payload;
    },
    // General
    resetRegistrationData: (state) => {
      state.selectedTrucks = [];
      state.selectedStates = [];
      state.licenseImage = null;
      state.adharImage = null;
      state.profileImage = null;
    },
  },
});

export const {
  setSelectedTrucks,
  toggleTruckSelection,
  setSelectedStates,
  toggleStateSelection,
  setLicenseImage,
  setAdharImage,
  setProfileImage,
  resetRegistrationData,
} = registrationSlice.actions;

export default registrationSlice.reducer;
