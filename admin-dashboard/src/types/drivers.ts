// ----------------------------------------------------------------
// Driver domain types – mirrors backend admin driver controller
// ----------------------------------------------------------------

export type VerificationStatus = "pending" | "approved" | "rejected";

export type RejectionCode =
  | "dl_unreadable"
  | "aadhaar_mismatch"
  | "plate_obscured"
  | "expired_docs"
  | "liveness_fail"
  | "other";

export interface VerifiedBy {
  id: string;
  name: string;
  email: string;
}

/** Shape returned by GET /api/admin/drivers (list item) */
export interface DriverListItem {
  id: string;
  userId: string;
  driverName: string;
  phoneNumber: string;
  email: string;
  gender: string | null;
  isBlocked: boolean;
  isSuspended: boolean;
  verificationStatus: VerificationStatus;
  rejectionReason: string;
  rejectionCode: string;
  vehicleType: string | null;
  vehicleNumber: string;
  /** Stored path – may be file:/// or empty; never render directly */
  profilePhoto: string;
  verifiedAt: string | null;
  verifiedBy: VerifiedBy | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /api/admin/drivers/:id (full detail) */
export interface DriverDetail extends DriverListItem {
  /** Stored path – may be file:/// or empty; never render as <img src> */
  aadhaarDocument: string;
  drivingLicenceDocument: string;
  vehiclePhoto: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DriversListResponse {
  success: boolean;
  drivers: DriverListItem[];
  pagination: Pagination;
}

export interface DriverDetailResponse {
  success: boolean;
  driver: DriverDetail;
}

export interface DriverActionResponse {
  success: boolean;
  message: string;
  driver: Partial<DriverDetail>;
}
