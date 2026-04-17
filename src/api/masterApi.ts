const BASE_URL = 'http://103.197.76.50:8087/api';

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

  const response = await fetch(`${BASE_URL}/master/vehicle-types`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await response.json();

  if (!response.ok) {
    console.error('[getVehicleTypes] ❌ Error response:', response.status, JSON.stringify(json, null, 2));
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  console.log('[getVehicleTypes] ✅ Success response:', JSON.stringify(json, null, 2));
  return json as GetVehicleTypesResponse;
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

  const response = await fetch(`${BASE_URL}/master/states`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await response.json();

  if (!response.ok) {
    console.error('[getStates] ❌ Error response:', response.status, JSON.stringify(json, null, 2));
    throw new Error(json?.message ?? `Request failed with status ${response.status}`);
  }

  console.log('[getStates] ✅ Success response:', JSON.stringify(json, null, 2));
  return json as GetStatesResponse;
};
