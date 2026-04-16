import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VehicleType, StateData } from '../../api/masterApi';

interface RegistrationState {
  selectedTrucks: VehicleType[];
  selectedStates: StateData[];
  licenseImage: string | null;
  adharImage: string | null;
}

const initialState: RegistrationState = {
  selectedTrucks: [],
  selectedStates: [],
  licenseImage: null,
  adharImage: null,
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
    setLicenseImage: (state, action: PayloadAction<string | null>) => {
      state.licenseImage = action.payload;
    },
    setAdharImage: (state, action: PayloadAction<string | null>) => {
      state.adharImage = action.payload;
    },
    // General
    resetRegistrationData: (state) => {
      state.selectedTrucks = [];
      state.selectedStates = [];
      state.licenseImage = null;
      state.adharImage = null;
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
  resetRegistrationData,
} = registrationSlice.actions;

export default registrationSlice.reducer;
