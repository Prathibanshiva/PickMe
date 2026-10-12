// ─── Scheduled Ride Types ────────────────────────────────────────────────────

export type ScheduledRideStatusFilter =
  | "all"
  | "assigned"
  | "confirmed"
  | "scheduled"
  | "cancelled";

export type ScheduledRideStatus =
  | "assigned"
  | "confirmed"
  | "scheduled"
  | "cancelled";

export type ScheduledRideMode = "shared" | "personal";

export interface ScheduledRideListItem {
  id: string;
  rideId: string; // e.g. SCH-4012
  scheduledAt: string; // ISO timestamp
  passenger: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  driver: {
    id: string;
    name: string;
    vehiclePlate: string;
    vehicleModel: string;
  } | null;
  pickup: string;
  dropoff: string;
  distanceKm: number | null;
  vehicleType: string;
  mode: ScheduledRideMode;
  estimatedFare: number | null;
  status: ScheduledRideStatus;
  createdAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface ScheduledRideMetrics {
  totalScheduled: number;
  assigned: number;
  confirmed: number;
  pendingMatch: number;
  cancelled: number;
}

export interface ScheduledRidePagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ScheduledRideServiceStatus {
  persisted: boolean;
  phase: string;
  message: string;
}

export interface ScheduledRideListResponse {
  success: boolean;
  scheduledRides: ScheduledRideListItem[];
  metrics: ScheduledRideMetrics;
  pagination: ScheduledRidePagination;
  serviceStatus: ScheduledRideServiceStatus;
}

export interface GetScheduledRidesParams {
  status?: string;
  search?: string;
  dateRange?: string;
  page?: number;
  limit?: number;
}
