import { apiClient } from "./client";
import type {
  GetPassengersParams,
  PassengerListResponse,
  PassengerDetailResponse,
  UpdatePassengerStatusPayload,
  UpdatePassengerStatusResponse,
} from "../types/passengers";

/**
 * GET /api/admin/passengers
 * List passengers with optional status filter, search query, and pagination.
 */
export async function getPassengers(
  params: GetPassengersParams = {}
): Promise<PassengerListResponse> {
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
  return apiClient<PassengerListResponse>(
    `/api/admin/passengers${qs ? `?${qs}` : ""}`
  );
}

/**
 * GET /api/admin/passengers/:id
 * Retrieve full passenger details by ID.
 */
export async function getPassengerById(
  id: string
): Promise<PassengerDetailResponse> {
  return apiClient<PassengerDetailResponse>(`/api/admin/passengers/${id}`);
}

/**
 * PUT /api/admin/passengers/:id/status
 * Update account status (block, unblock, suspend, restore).
 */
export async function updatePassengerStatus(
  id: string,
  payload: UpdatePassengerStatusPayload
): Promise<UpdatePassengerStatusResponse> {
  return apiClient<UpdatePassengerStatusResponse>(
    `/api/admin/passengers/${id}/status`,
    {
      method: "PUT",
      body: payload,
    }
  );
}

