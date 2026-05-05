import { useMutation } from '@tanstack/react-query';
import { fetchAddressFromCoords } from '../api/mapApi';

/**
 * Hook to reverse geocode coordinates into a human-readable address.
 * 
 * Usage:
 *   const { mutateAsync: getAddress, isPending } = useReverseGeocode();
 *   const address = await getAddress({ lat, lng });
 */
export const useReverseGeocode = (options?: {
  onSuccess?: (address: string | null) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation<string | null, Error, { lat: number; lng: number }>({
    mutationFn: ({ lat, lng }) => fetchAddressFromCoords(lat, lng),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
