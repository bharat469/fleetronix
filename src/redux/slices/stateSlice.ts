import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StateData } from '../../api/masterApi';

interface MasterState {
  selectedStates: StateData[];
}

const initialState: MasterState = {
  selectedStates: [],
};

const stateSlice = createSlice({
  name: 'state',
  initialState,
  reducers: {
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
    clearSelectedStates: (state) => {
      state.selectedStates = [];
    },
  },
});

export const { setSelectedStates, toggleStateSelection, clearSelectedStates } = stateSlice.actions;
export default stateSlice.reducer;
