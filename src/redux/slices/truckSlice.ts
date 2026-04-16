import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VehicleType } from '../../api/masterApi';

interface TruckState {
  selectedTrucks: VehicleType[];
}

const initialState: TruckState = {
  selectedTrucks: [],
};

const truckSlice = createSlice({
  name: 'truck',
  initialState,
  reducers: {
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
    clearSelectedTrucks: (state) => {
      state.selectedTrucks = [];
    },
  },
});

export const { setSelectedTrucks, toggleTruckSelection, clearSelectedTrucks } = truckSlice.actions;
export default truckSlice.reducer;
