// ─── Ride Types ───────────────────────────────────────────────────────────────

export type RideStatusFilter =
  | "all"
  | "live"
  | "upcoming"
  | "completed"
  | "cancelled";

export type RideStatus =
  | "live"
  | "driver_assigned"
  | "upcoming"
  | "completed"
  | "cancelled";

export type RideMode = "shared" | "personal";

export type VehicleType = "Auto" | "Sedan" | "Car" | "Bike" | "SUV";

export interface RideListItem {
  id: string;
  rideId: string; // e.g. PKM-88294
  passenger: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  driver: {
    id: string;
    name: string;
    vehicleModel: string;
  } | null;
  pickup: string;
  dropoff: string;
  vehicleType: VehicleType | string;
  mode: RideMode;
  fare: number | null;
  status: RideStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface RideMetrics {
  liveRides: number;
  upcomingRides: number;
  completedRides: number;
  cancelledRides: number;
  totalRides: number;
}

export interface RidePagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RideServiceStatus {
  persisted: boolean;
  phase: string;
  message: string;
}

export interface RideListResponse {
  success: boolean;
  rides: RideListItem[];
  metrics: RideMetrics;
  pagination: RidePagination;
  serviceStatus: RideServiceStatus;
}

export interface GetRidesParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}
