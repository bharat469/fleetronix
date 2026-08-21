export interface Trip {
  total_trip_cost: string;
  item_weight: any;
  customer_mobile: string;
  weight: string;
  price: string;
  truck_type: string;
  customer_name: string;
  distance: string;
  pickup_code_verified: boolean;
  delivery_code_verified: boolean;
  estimated_distance_km: number;
  drop: string | undefined;
  id: string | undefined;
  load_id: string;
  trip_id: string;
  trip_number: string;
  load_number?: string;
  status: 'assigned' | 'started' | 'in_progress' | 'completed' | string;

  pickup_city: string;
  source_city?: string;
  source_address?: string;
  source_latitude?: number | string;
  source_longitude?: number | string;

  drop_city: string;
  destination_city?: string;
  destination_address?: string;
  destination_latitude?: number | string;
  destination_longitude?: number | string;

  assigned_at: string;
  started_at?: string;
  estimated_delivery: string;
  estimated_delivery_time?: string;

  trip_estimate: number | string;
  trip_cost?: number | string;

  driver_name: string;
  shipperName?: string;
  shipper_name_first?: string;
  shipper_name_last?: string;
  driver_photo_url?: string;
  image?: string;
  task?: string;
  driver_mobile?: string;
  owner_name?: string;
  vehicle_number?: string;
  pod_recipient_name?: string;
  pod_delivery_date?: string;
  pod_delivery_time?: string;
  pod_confirmation_number?: string;
  pod_status?: 'pending' | 'approved' | 'rejected' | string;
  pod_submitted?: boolean;
  pod_documents?: string[];
  pod_can_reupload?: boolean;
  pod_reupload_count?: number;
  pod_rejection_remark?: string | null;
  driver_source?: string;
  amount?: string | number;
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
