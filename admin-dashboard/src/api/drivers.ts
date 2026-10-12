import { apiClient } from "./client";
import type {
  DriversListResponse,
  DriverDetailResponse,
  DriverActionResponse,
} from "../types/drivers";

export interface GetDriversParams {
  status?: "all" | "pending" | "approved" | "rejected";
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * GET /api/admin/drivers
 * List drivers with optional status filter, search query, and pagination.
 */
export async function getDrivers(
  params: GetDriversParams = {}
): Promise<DriversListResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all")
    query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<DriversListResponse>(`/api/admin/drivers${qs ? `?${qs}` : ""}`);
}

/**
 * GET /api/admin/drivers/:id
 * Retrieve full driver profile including document paths.
 */
export async function getDriverById(id: string): Promise<DriverDetailResponse> {
  return apiClient<DriverDetailResponse>(`/api/admin/drivers/${id}`);
}

/**
 * PUT /api/admin/drivers/:id/approve
 * Approve a pending driver profile.
 */
export async function approveDriver(id: string): Promise<DriverActionResponse> {
  return apiClient<DriverActionResponse>(`/api/admin/drivers/${id}/approve`, {
    method: "PUT",
  });
}

/**
 * PUT /api/admin/drivers/:id/reject
 * Reject a pending driver profile with reason and optional code.
 */
export async function rejectDriver(
  id: string,
  rejectionReason: string,
  rejectionCode?: string
): Promise<DriverActionResponse> {
  return apiClient<DriverActionResponse>(`/api/admin/drivers/${id}/reject`, {
    method: "PUT",
    body: { rejectionReason, rejectionCode },
  });
}
