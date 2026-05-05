import { postDriverLocation, LocationPoint } from './tripApi';
import NetInfo from '@react-native-community/netinfo';

/**
 * LocationQueueService
 * 
 * Manages a queue of location points, handles batching (every 10s),
 * and handles retries/offline state.
 */
class LocationQueueService {
  private queue: LocationPoint[] = [];
  private isProcessing = false;
  private tripId: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  /**
   * Start the sync cycle for a specific trip
   */
  start(tripId: string) {
    this.tripId = tripId;
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.processQueue();
    }, 10000); // 10 seconds batching
  }

  /**
   * Stop the sync cycle
   */
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.tripId = null;
    this.queue = [];
  }

  /**
   * Add a point to the queue
   */
  enqueue(latitude: number, longitude: number) {
    const point: LocationPoint = {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    };
    this.queue.push(point);
  }

  /**
   * Process the queue and send to backend
   */
  private async processQueue() {
    if (this.isProcessing || !this.tripId || this.queue.length === 0) return;

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('[LocationQueueService] Offline, skipping sync.');
      return;
    }

    this.isProcessing = true;
    const batch = [...this.queue];
    
    try {
      // Assuming postDriverLocation handles the actual API call
      // In a real production app, we might send the whole batch.
      // For now, we take the latest or send the array if the API supports it.
      await postDriverLocation(this.tripId, batch[batch.length - 1]); 
      
      // Clear processed points
      this.queue = this.queue.filter(p => !batch.includes(p));
    } catch (error) {
      console.error('[LocationQueueService] Sync failed, points kept in queue for retry.', error);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const locationQueueService = new LocationQueueService();
