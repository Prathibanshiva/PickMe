export interface PassengerMetrics {
  total: number;
  active: number;
  suspended: number;
  blocked: number;
}

export interface VehicleDistribution {
  auto: number;
  sedan: number;
  car: number;
  bike: number;
  suv: number;
  unassigned: number;
}

export interface DriverMetrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  vehicleDistribution: VehicleDistribution;
}

export interface RecentActivityItem {
  id: string;
  driverName: string;
  vehicleType: string;
  vehicleNumber: string;
  verificationStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  verifiedAt?: string | null;
}

export interface OperationalServiceStatus {
  persisted: boolean;
  phase: string;
  totalRides?: number;
  liveRides?: number;
  completedToday?: number;
  totalScheduled?: number;
  pendingMatch?: number;
  message: string;
}

export interface DashboardOverviewResponse {
  success: boolean;
  timestamp: string;
  passengers: PassengerMetrics;
  drivers: DriverMetrics;
  recentActivity: RecentActivityItem[];
  rides: OperationalServiceStatus;
  scheduledRides: OperationalServiceStatus;
  systemStatus: {
    network: string;
    status: string;
  };
  message?: string;
}
