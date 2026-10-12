import { apiClient } from "./client";
import type { DashboardOverviewResponse } from "../types/dashboard";

/**
 * GET /api/admin/dashboard/overview
 * Fetches real operational metrics, driver verification queue, and Phase C architecture status.
 */
export async function getDashboardOverview(): Promise<DashboardOverviewResponse> {
  return apiClient<DashboardOverviewResponse>("/api/admin/dashboard/overview");
}
