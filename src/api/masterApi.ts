import apiClient from './apiClient';

export interface VehicleType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetVehicleTypesResponse {
  success: boolean;
  message: string;
  data: VehicleType[];
}

export const getVehicleTypes = async (): Promise<GetVehicleTypesResponse> => {
  console.log('[getVehicleTypes] 📥 Fetching vehicle types...');
  const response = await apiClient.get('/master/vehicle-types');
  console.log('[getVehicleTypes] ✅ Success response:', JSON.stringify(response.data, null, 2));
  return response.data as GetVehicleTypesResponse;
};

export interface StateData {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetStatesResponse {
  success: boolean;
  message: string;
  data: StateData[];
}

export const getStates = async (): Promise<GetStatesResponse> => {
  console.log('[getStates] 📥 Fetching states...');
  const response = await apiClient.get('/master/states');
  console.log('[getStates] ✅ Success response:', JSON.stringify(response.data, null, 2));
  return response.data as GetStatesResponse;
};
