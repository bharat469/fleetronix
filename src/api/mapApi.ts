import Config from 'react-native-config';

export interface GeocodingResponse {
  plus_code: any;
  results: Array<{
    formatted_address: string;
    geometry: any;
    place_id: string;
    types: string[];
  }>;
  status: string;
}

export const fetchAddressFromCoords = async (lat: number, lng: number): Promise<string | null> => {
  const apiKey = Config.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  console.log('[mapApi] 📥 Fetching address for:', lat, lng);

  const response = await fetch(url);
  const data: GeocodingResponse = await response.json();

  if (data.status === 'OK' && data.results.length > 0) {
    console.log('[mapApi] ✅ Found address:', data.results[0].formatted_address);
    return data.results[0].formatted_address;
  }

  if (data.status !== 'OK') {
    console.error('[mapApi] ❌ Geocoding failed:', data.status, (data as any).error_message || '');
  }

  return null;
};
