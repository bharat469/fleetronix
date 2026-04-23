export interface Trip {
  trip_id: string;
  trip_number: string;
  status: 'assigned' | 'started' | 'in_progress' | 'completed' | string;
  pickup_city: string;
  drop_city: string;
  assigned_at: string;
  started_at?: string;
  estimated_delivery: string;
  trip_estimate: number | string;
  driver_name: string;
  driver_photo_url?: string;

  // Add other fields as per API response
  [key: string]: any;
}

export interface Pagination {
  page: number;
  pages: number;
  per_page: number;
  total: number;
}

export interface TripResponse {
  success: boolean;
  data: Trip[];
  pagination: Pagination;
  message?: string;
}

export interface TripParams {
  filter: 'all' | 'assigned' | 'ongoing' | 'completed';
  page: number;
  per_page: number;
}
