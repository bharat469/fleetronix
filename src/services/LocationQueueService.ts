import { postDriverLocationBatch, LocationPoint } from './tripApi';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { storage } from '../helpers/asyncHelper';

const STORAGE_KEY = 'offline_locations_queue';
const BASE_SYNC_INTERVAL = 15000; // 15 seconds default sync interval
const MAX_SYNC_INTERVAL = 60000;  // 1 minute max retry delay

class LocationQueueService {
  private queue: LocationPoint[] = [];
  private isProcessing = false;
  private tripId: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private unsubscribeNetInfo: (() => void) | null = null;
  
  // Exponential backoff properties
  private currentSyncInterval = BASE_SYNC_INTERVAL;
  private isOffline = false;

  constructor() {
    this.initializeQueue();
  }

  /**
   * Load saved offline coordinates from AsyncStorage on boot
   */
  private async initializeQueue() {
    try {
      const stored = await storage.get(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[LocationQueueService] Loaded ${this.queue.length} coordinates from storage`);
      }
    } catch (e) {
      console.warn('[LocationQueueService] Failed to load offline queue:', e);
      this.queue = [];
    }
  }

  /**
   * Save the current queue to AsyncStorage to prevent data loss on crash/reboot
   */
  private async saveQueue() {
    try {
      await storage.set(STORAGE_KEY, this.queue);
    } catch (e) {
      console.warn('[LocationQueueService] Failed to save queue to storage:', e);
    }
  }

  /**
   * Start the sync cycle and register network status listeners
   */
  public async start(tripId: string) {
    this.tripId = tripId;
    this.currentSyncInterval = BASE_SYNC_INTERVAL;
    
    // Initialize/sync if queue already has items from a previous session
    if (this.queue.length > 0) {
      this.processQueue();
    }

    this.startSyncTimer();

    // Listen to network status changes
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = this.isOffline;
      this.isOffline = !state.isConnected;

      if (state.isConnected && wasOffline) {
        console.log('[LocationQueueService] Network restored. Syncing immediately.');
        this.currentSyncInterval = BASE_SYNC_INTERVAL;
        this.startSyncTimer();
        this.processQueue();
      }
    });
  }

  /**
   * Stop the sync cycle and clean up resources
   */
  public stop() {
    this.stopSyncTimer();
    
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    
    this.tripId = null;
  }

  /**
   * Clear the cached queue completely (e.g. when a trip ends or is reset)
   */
  public async clear() {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Queue a location point for batching and write to AsyncStorage
   */
  public async enqueue(latitude: number, longitude: number) {
    // Avoid queuing duplicate coordinates if they are extremely close to the last queued point
    if (this.queue.length > 0) {
      const lastPoint = this.queue[this.queue.length - 1];
      if (lastPoint.latitude === latitude && lastPoint.longitude === longitude) {
        return; // Skip duplicate
      }
    }

    const point: LocationPoint = {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    };
    
    this.queue.push(point);
    console.log(`[LocationQueueService] Enqueued coordinate. Queue size: ${this.queue.length}`);
    await this.saveQueue();

    // If we're not currently running a sync timer and a trip is active, start sync
    if (this.tripId && !this.timer) {
      this.startSyncTimer();
    }
  }

  /**
   * Get the current queue size
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Set up/reset the sync timer interval
   */
  private startSyncTimer() {
    this.stopSyncTimer();
    this.timer = setInterval(() => {
      this.processQueue();
    }, this.currentSyncInterval);
  }

  private stopSyncTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Process the queue, attempt to upload batch, and handle backoff on failure
   */
  private async processQueue() {
    if (this.isProcessing || !this.tripId || this.queue.length === 0) return;

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('[LocationQueueService] Offline. Skipping sync.');
      this.isOffline = true;
      return;
    }
    
    this.isOffline = false;
    this.isProcessing = true;

    // Snapshot of points to process (prevents deleting new points added during upload)
    const batchToUpload = [...this.queue];
    console.log(`[LocationQueueService] Syncing batch of ${batchToUpload.length} location points...`);

    try {
      await postDriverLocationBatch(this.tripId, batchToUpload);
      
      // Upload successful: Filter out successfully uploaded points
      this.queue = this.queue.filter(p => !batchToUpload.includes(p));
      await this.saveQueue();
      
      console.log(`[LocationQueueService] Sync success. Remaining in queue: ${this.queue.length}`);

      // Reset exponential backoff on success
      if (this.currentSyncInterval !== BASE_SYNC_INTERVAL) {
        console.log('[LocationQueueService] Resetting sync interval to default.');
        this.currentSyncInterval = BASE_SYNC_INTERVAL;
        this.startSyncTimer();
      }
    } catch (error) {
      console.warn('[LocationQueueService] Sync failed. Retrying with backoff.', error);
      
      // Increase interval exponentially on failure (backoff)
      this.currentSyncInterval = Math.min(this.currentSyncInterval * 2, MAX_SYNC_INTERVAL);
      console.log(`[LocationQueueService] Backing off. Next sync in ${this.currentSyncInterval / 1000}s`);
      this.startSyncTimer();
    } finally {
      this.isProcessing = false;
    }
  }
}

export const locationQueueService = new LocationQueueService();
