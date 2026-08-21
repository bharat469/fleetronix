import { AppState, AppStateStatus, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { getDistance } from 'geolib';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { locationQueueService } from './LocationQueueService';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

type LocationCallback = (coord: Coordinate, speed: number, heading: number) => void;

class LocationTrackingManager {
  private activeTripId: string | null = null;
  private watchId: number | null = null;
  
  // State for upload thresholds
  private lastUploadedLocation: Coordinate | null = null;
  private lastUploadedTime = 0;
  
  // State for battery optimization (switching accuracy)
  private isHighAccuracy = true;
  private lastMovementTime = 0;
  private stationaryCheckTimer: ReturnType<typeof setInterval> | null = null;
  private lastCheckedPosition: Coordinate | null = null;

  // Registered UI callbacks for smooth real-time map updates
  private callbacks = new Set<LocationCallback>();

  constructor() {
    // Monitor AppState to dynamically adjust behavior if needed
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Start tracking for a given trip
   */
  public async start(tripId: string) {
    if (this.activeTripId === tripId && this.watchId !== null) {
      console.log(`[LocationTrackingManager] Already tracking trip: ${tripId}`);
      return;
    }

    console.log(`[LocationTrackingManager] Starting live tracking for trip: ${tripId}`);
    this.activeTripId = tripId;
    
    // Reset state
    this.lastUploadedLocation = null;
    this.lastUploadedTime = 0;
    this.lastMovementTime = Date.now();
    this.isHighAccuracy = true;

    // Create the notification channel on Android before starting the watcher
    if (Platform.OS === 'android') {
      try {
        await notifee.createChannel({
          id: 'location_tracking_channel',
          name: 'Live Location Tracking',
          importance: AndroidImportance.HIGH,
        });
        console.log('[LocationTrackingManager] Created Android notification channel: location_tracking_channel');
      } catch (e) {
        console.warn('[LocationTrackingManager] Failed to create notification channel:', e);
      }
    }

    // Start Location Queue Service
    await locationQueueService.start(tripId);

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      console.error('[LocationTrackingManager] Location permissions not granted.');
      return;
    }

    // Start watching position
    this.startWatcher();
    this.startStationaryMonitor();
  }

  /**
   * Stop tracking
   */
  public stop() {
    console.log('[LocationTrackingManager] Stopping live tracking.');
    
    this.stopWatcher();
    this.stopStationaryMonitor();

    locationQueueService.stop();
    this.activeTripId = null;
    this.lastUploadedLocation = null;
    this.lastUploadedTime = 0;
  }

  /**
   * Register a callback to receive real-time coordinates (for map markers)
   */
  public onLocationUpdate(callback: LocationCallback) {
    this.callbacks.add(callback);
  }

  /**
   * Unregister location callback
   */
  public offLocationUpdate(callback: LocationCallback) {
    this.callbacks.delete(callback);
  }

  /**
   * Check and request appropriate permissions
   */
  private async checkPermissions(): Promise<boolean> {
    const isIOS = Platform.OS === 'ios';
    
    // Request Always permission if available, fallback to WhenInUse
    if (isIOS) {
      const alwaysStatus = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
      if (alwaysStatus === RESULTS.GRANTED) return true;
      
      const whenInUseStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return whenInUseStatus === RESULTS.GRANTED;
    } else {
      const fineStatus = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      if (fineStatus !== RESULTS.GRANTED) return false;

      // Access background location is required for Android 10+ (API level 29+)
      const androidVersion = typeof Platform.Version === 'string'
        ? parseInt(Platform.Version, 10)
        : Platform.Version;

      if (androidVersion >= 29) {
        const bgStatus = await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
        if (bgStatus !== RESULTS.GRANTED) {
          console.warn('[LocationTrackingManager] ACCESS_BACKGROUND_LOCATION not granted. Background updates might be restricted.');
        }
      }
      return true;
    }
  }

  /**
   * Start Geolocation watch with current accuracy setting
   */
  private startWatcher() {
    this.stopWatcher();

    const config = this.isHighAccuracy 
      ? {
          enableHighAccuracy: true,
          accuracy: {
            android: 'high',
            ios: 'bestForNavigation',
          },
          distanceFilter: 5, // Receive updates frequently for UI smoothness
          interval: 5000,
          fastestInterval: 2000,
        }
      : {
          enableHighAccuracy: false,
          accuracy: {
            android: 'balanced',
            ios: 'nearestTenMeters',
          },
          distanceFilter: 15,
          interval: 15000,
          fastestInterval: 10000,
        };

    const extraConfig = Platform.select({
      ios: {
        showsBackgroundLocationIndicator: true,
        activityType: 'automotiveNavigation',
      },
      android: {
        forceRequestLocation: true,
        showLocationDialog: true,
        foregroundService: {
          channelId: 'location_tracking_channel',
          channelName: 'Live Location Tracking',
          notificationTitle: 'Delivery Tracking Active',
          notificationBody: 'Sharing your live location for route updates.',
          notificationIcon: 'ic_launcher',
          color: '#CA2027',
        }
      }
    });

    console.log(`[LocationTrackingManager] Starting watcher. High Accuracy: ${this.isHighAccuracy}`);

    this.watchId = Geolocation.watchPosition(
      (position) => this.handleGPSUpdate(position),
      (error) => console.warn('[LocationTrackingManager] GPS Watch Error:', error.message),
      { ...config, ...extraConfig } as any
    );
  }

  private stopWatcher() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Process incoming raw GPS updates and filter intelligently
   */
  private handleGPSUpdate(position: Geolocation.GeoPosition) {
    const { latitude, longitude, speed: rawSpeed, heading: rawHeading } = position.coords;
    const currentCoord: Coordinate = { latitude, longitude };
    const speedMps = rawSpeed ?? 0;
    const heading = rawHeading ?? 0;

    // Trigger UI updates immediately (for smooth truck marker rotation/movement)
    this.callbacks.forEach(cb => cb(currentCoord, speedMps, heading));

    // Evaluate if we should queue/upload this coordinate
    const now = Date.now();
    const timeElapsed = now - this.lastUploadedTime;
    
    // Distance from the last successfully uploaded position
    const distance = this.lastUploadedLocation
      ? getDistance(currentCoord, this.lastUploadedLocation)
      : Infinity;

    // DRIFT REJECTION: Ignore coordinates that are too close, unless a long time has passed
    const isDrift = distance < 5; 

    // Determine upload thresholds based on AppState & speed
    let distanceThreshold = 50; // default 50 meters
    let timeThreshold = 5 * 60 * 1000; // default 5 minutes

    const isBackground = AppState.currentState !== 'active';

    if (isBackground) {
      // Requirements: Reduce update frequency in background to save battery/network
      distanceThreshold = 150;
      timeThreshold = 10 * 60 * 1000; // 10 minutes
    } else if (speedMps > 15) { // > 54 km/h
      // Requirements: Drive at high speed -> increase update frequency intelligently
      distanceThreshold = 100;
      timeThreshold = 30 * 1000; // 30 seconds
    } else if (speedMps > 8) { // > 30 km/h
      distanceThreshold = 80;
      timeThreshold = 60 * 1000; // 1 minute
    }

    const meetsDistance = distance >= distanceThreshold;
    const meetsTime = timeElapsed >= timeThreshold;

    let shouldUpload = false;
    
    if (!this.lastUploadedLocation) {
      // First point is always uploaded immediately
      shouldUpload = true;
    } else if (isDrift && !meetsTime) {
      // If it's a drift and time threshold hasn't met, do not upload
      shouldUpload = false;
    } else {
      shouldUpload = meetsDistance || meetsTime;
    }

    if (shouldUpload) {
      console.log(`[LocationTrackingManager] Queueing point. Distance: ${distance.toFixed(1)}m, Speed: ${(speedMps * 3.6).toFixed(1)}km/h, MeetsTime: ${meetsTime}`);
      locationQueueService.enqueue(latitude, longitude);
      this.lastUploadedLocation = currentCoord;
      this.lastUploadedTime = now;
    }

    // Keep track of movement to optimize battery usage
    if (distance >= 5) {
      this.lastMovementTime = now;
      
      // If we are currently in balanced accuracy, switch back to high accuracy immediately
      if (!this.isHighAccuracy) {
        console.log('[LocationTrackingManager] Movement detected. Switching back to high accuracy.');
        this.isHighAccuracy = true;
        this.startWatcher();
      }
    }
  }

  /**
   * Monitor stationary status to conserve battery by downgrading GPS accuracy
   */
  private startStationaryMonitor() {
    this.stopStationaryMonitor();

    // Check movement every minute
    this.stationaryCheckTimer = setInterval(() => {
      const now = Date.now();
      const idleTime = now - this.lastMovementTime;

      // If idle for more than 3 minutes, downgrade accuracy to save battery
      if (idleTime > 3 * 60 * 1000 && this.isHighAccuracy) {
        console.log('[LocationTrackingManager] Device stationary for 3 mins. Switching to balanced accuracy.');
        this.isHighAccuracy = false;
        this.startWatcher();
      }
    }, 60000);
  }

  private stopStationaryMonitor() {
    if (this.stationaryCheckTimer) {
      clearInterval(this.stationaryCheckTimer);
      this.stationaryCheckTimer = null;
    }
  }

  /**
   * Listen for AppState changes to adjust tracking parameters (like throttled background checks)
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (!this.activeTripId) return;

    console.log(`[LocationTrackingManager] AppState changed to: ${nextAppState}`);
    // Re-evaluate watcher settings (react-native-geolocation-service adapts, but we log the transition)
    if (nextAppState === 'background') {
      console.log('[LocationTrackingManager] App backgrounded. Dynamic thresholds adjusted.');
    } else if (nextAppState === 'active') {
      console.log('[LocationTrackingManager] App foregrounded. Restoring default frequency.');
    }
  };
}

export const locationTrackingManager = new LocationTrackingManager();
export default locationTrackingManager;
