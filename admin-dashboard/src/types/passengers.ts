export type PassengerStatusFilter = "all" | "active" | "suspended" | "blocked";

export interface AssociatedDriverProfile {
  id: string;
  verificationStatus: string;
  vehicleType: string;
  vehicleNumber: string;
}

export interface PassengerListItem {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  gender: "Male" | "Female" | "Other" | null;
  defaultRole: string;
  isBlocked: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PassengerDetail extends PassengerListItem {
  driverProfile?: AssociatedDriverProfile | null;
}

export interface PassengerPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PassengerListResponse {
  success: boolean;
  passengers: PassengerListItem[];
  pagination: PassengerPagination;
}

export interface PassengerDetailResponse {
  success: boolean;
  passenger: PassengerDetail;
}

export interface GetPassengersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type AccountAction = "block" | "unblock" | "suspend" | "restore";

export interface AccountAuditAttribution {
  performedBy: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  reason?: string;
}

export interface UpdatePassengerStatusPayload {
  action?: AccountAction;
  status?: "active" | "suspended" | "blocked";
  reason?: string;
}

export interface UpdatePassengerStatusResponse {
  success: boolean;
  message: string;
  passenger: PassengerListItem;
  audit?: AccountAuditAttribution;
}

