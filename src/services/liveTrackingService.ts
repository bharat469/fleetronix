/**
 * liveTrackingService.ts
 *
 * Currently uses mocked data. To switch to real backend:
 *  1. Replace `fetchLiveTripData` body with: return (await apiClient.get(`driver/trips/${tripId}/live`)).data
 *  2. Replace the mock simulation timer in useLiveTracking with real Socket.IO:
 *       const socket = io('wss://your-server', { auth: { token } });
 *       socket.on('location_update', handler);
 */

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Mock Route (Dehradun → Haridwar) ────────────────────────────────────────
// Replace with real GPS coordinates from your backend/tracking device

export const MOCK_ROUTE_COORDINATES: Coordinate[] = [
  { latitude: 30.3165, longitude: 78.0322 }, // 0  – Pickup: Rispana Bridge, Dehradun
  { latitude: 30.3200, longitude: 78.0450 },
  { latitude: 30.3250, longitude: 78.0580 },
  { latitude: 30.3310, longitude: 78.0700 },
  { latitude: 30.3370, longitude: 78.0820 },
  { latitude: 30.3420, longitude: 78.0950 },
  { latitude: 30.3480, longitude: 78.1080 },
  { latitude: 30.3530, longitude: 78.1200 },
  { latitude: 30.3580, longitude: 78.1330 },
  { latitude: 30.3630, longitude: 78.1460 }, // 9  – Destination: Haridwar
];

const MOCK_STATUSES: TripStatus[] = [
  'assigned',
  'pickup_started',
  'picked_up',
  'in_transit',
  'near_destination',
  'delivered',
];

// ─── Mutable simulation state ─────────────────────────────────────────────────

let _coordIndex = 0;
let _statusIndex = 0;

export const advanceMockSimulation = (): void => {
  const totalCoords = MOCK_ROUTE_COORDINATES.length - 1;
  if (_coordIndex < totalCoords) _coordIndex += 1;

  const step = Math.max(1, Math.floor(totalCoords / (MOCK_STATUSES.length - 1)));
  const targetStatus = Math.min(
    Math.floor(_coordIndex / step),
    MOCK_STATUSES.length - 1,
  );
  if (targetStatus > _statusIndex) _statusIndex = targetStatus;
};

export const resetMockSimulation = (): void => {
  _coordIndex = 0;
  _statusIndex = 0;
};

/**
 * REST polling response.
 * REPLACE body with: return (await apiClient.get(`driver/trips/${tripId}/live`)).data
 */
export const fetchLiveTripData = async (tripId: string): Promise<LiveTripData> => {
  await new Promise((r) => setTimeout(r, 200)); // simulate latency

  const total = MOCK_ROUTE_COORDINATES.length - 1;
  const distanceRemaining = parseFloat(
    ((1 - _coordIndex / total) * 42).toFixed(1),
  );

  return {
    tripId,
    loadNumber: 'FLX-2024-0042',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91 98765 43210',
    vehicleNumber: 'UK 07 CA 1234',
    status: MOCK_STATUSES[_statusIndex],
    currentLocation: MOCK_ROUTE_COORDINATES[_coordIndex],
    pickupLocation: MOCK_ROUTE_COORDINATES[0],
    pickupAddress: 'Rispana Bridge, Dehradun, UK',
    destinationLocation: MOCK_ROUTE_COORDINATES[total],
    destinationAddress: 'Haridwar Railway Station, Haridwar, UK',
    etaMinutes: Math.round(distanceRemaining * 1.5),
    distanceRemaining,
  };
};

// ─── Tiny event emitter (replace with Socket.IO when backend is ready) ────────

type EventHandler = (...args: any[]) => void;

class SimpleEmitter {
  private listeners: Record<string, EventHandler[]> = {};

  on(event: string, handler: EventHandler): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.listeners[event] = (this.listeners[event] ?? []).filter(
      (h) => h !== handler,
    );
  }

  emit(event: string, ...args: any[]): void {
    (this.listeners[event] ?? []).forEach((h) => h(...args));
  }
}

/**
 * Singleton emitter — acts as the WebSocket message bus.
 * When you switch to Socket.IO, pipe socket events into this emitter:
 *   socket.on('location_update', (data) => trackingEmitter.emit('location_update', data));
 */
export const trackingEmitter = new SimpleEmitter();

export interface LocationUpdatePayload {
  coordinate: Coordinate;
  status: TripStatus;
  etaMinutes: number;
  distanceRemaining: number;
}
