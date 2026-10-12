import { apiClient } from "./client";
import type { RideListResponse, GetRidesParams } from "../types/rides";

/**
 * GET /api/admin/rides
 * List rides with optional status filter, search query, and pagination.
 */
export async function getRides(
  params: GetRidesParams = {}
): Promise<RideListResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.search) {
    query.set("search", params.search);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  const qs = query.toString();
  return apiClient<RideListResponse>(
    `/api/admin/rides${qs ? `?${qs}` : ""}`
  );
}
