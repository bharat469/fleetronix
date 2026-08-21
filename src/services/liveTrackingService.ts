/**
 * liveTrackingService.ts
 * 
 * Core types for live location tracking.
 */

export type TripStatus =
  | 'assigned'
  | 'pickup_started'
  | 'picked_up'
  | 'in_transit'
  | 'near_destination'
  | 'delivered';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface LiveTripData {
  tripId: string;
  loadNumber: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  status: TripStatus;
  currentLocation: Coordinate;
  pickupLocation: Coordinate;
  pickupAddress: string;
  destinationLocation: Coordinate;
  destinationAddress: string;
  etaMinutes: number;
  distanceRemaining: number; // km
}

export interface LocationUpdatePayload {
  coordinate: Coordinate;
  status: TripStatus;
  etaMinutes: number;
  distanceRemaining: number;
}
