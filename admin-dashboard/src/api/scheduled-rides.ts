import { apiClient } from "./client";
import type {
  ScheduledRideListResponse,
  GetScheduledRidesParams,
} from "../types/scheduled-rides";

/**
 * GET /api/admin/scheduled-rides
 * List scheduled rides with optional status filter, search, date range, and pagination.
 */
export async function getScheduledRides(
  params: GetScheduledRidesParams = {}
): Promise<ScheduledRideListResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.search) {
    query.set("search", params.search);
  }
  if (params.dateRange) {
    query.set("dateRange", params.dateRange);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  const qs = query.toString();
  return apiClient<ScheduledRideListResponse>(
    `/api/admin/scheduled-rides${qs ? `?${qs}` : ""}`
  );
}
