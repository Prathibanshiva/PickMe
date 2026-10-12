import React, { useState, useEffect, useCallback, useRef } from "react";
import { getRides } from "../api/rides";
import type {
  RideListItem,
  RideMetrics,
  RideStatusFilter,
  RideServiceStatus,
} from "../types/rides";
import type { ApiError } from "../types/auth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TAB_CONFIG: {
  key: RideStatusFilter;
  label: string;
  metricKey: keyof RideMetrics;
  icon?: string;
  pulse?: boolean;
}[] = [
  { key: "live", label: "Live", metricKey: "liveRides", pulse: true },
  { key: "upcoming", label: "Upcoming", metricKey: "upcomingRides" },
  { key: "completed", label: "Completed", metricKey: "completedRides" },
  { key: "cancelled", label: "Cancelled", metricKey: "cancelledRides" },
  { key: "all", label: "All", metricKey: "totalRides" },
];

function statusBadge(status: RideListItem["status"]) {
  switch (status) {
    case "live":
      return (
        <span className="admin-badge admin-badge-live">
          <span className="admin-badge-dot admin-badge-dot-pulse" />
          Live
        </span>
      );
    case "driver_assigned":
      return (
        <span className="admin-badge admin-badge-pending">
          <span className="admin-badge-dot" />
          Driver Assigned
        </span>
      );
    case "upcoming":
      return (
        <span className="admin-badge admin-badge-pending">
          <span className="admin-badge-dot" />
          Upcoming
        </span>
      );
    case "completed":
      return (
        <span className="admin-badge admin-badge-success">
          <span className="admin-badge-dot" />
          Completed
        </span>
      );
    case "cancelled":
      return (
        <span className="admin-badge admin-badge-error">
          <span className="admin-badge-dot" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="admin-badge admin-badge-neutral">
          <span className="admin-badge-dot" />
          {status}
        </span>
      );
  }
}

function modeBadge(mode: RideListItem["mode"]) {
  if (mode === "shared") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: 9999,
          background: "rgba(72,227,46,0.15)",
          color: "var(--color-success)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.03em",
        }}
      >
        Shared
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 9999,
        background: "var(--color-surface-container-high)",
        color: "var(--color-text-secondary)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
      }}
    >
      Personal
    </span>
  );
}

function avatarInitials(name: string) {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const PAGE_SIZE = 10;

// ─── Phase C Empty State ──────────────────────────────────────────────────────

interface PhaseCBannerProps {
  serviceStatus: RideServiceStatus;
}

const PhaseCBanner: React.FC<PhaseCBannerProps> = ({ serviceStatus }) => (
  <div
    className="admin-card"
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 32px",
      gap: 16,
      textAlign: "center",
      minHeight: 280,
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "var(--color-surface-container-high)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 28, color: "var(--color-primary)" }}
      >
        commute
      </span>
    </div>
    <div>
      <p
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "var(--color-text-primary)",
          marginBottom: 6,
        }}
      >
        Ride History Not Yet Persisted
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--color-text-secondary)",
          maxWidth: 440,
          lineHeight: 1.6,
        }}
      >
        {serviceStatus.message}
      </p>
    </div>
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 9999,
        background: "var(--color-surface-container)",
        color: "var(--color-text-secondary)",
        fontSize: 12,
        fontWeight: 600,
        marginTop: 4,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 14 }}
      >
        schedule
      </span>
      {serviceStatus.phase}
    </span>
  </div>
);

// ─── Metric Chip ─────────────────────────────────────────────────────────────

interface MetricCount {
  value: number;
  active: boolean;
}

function MetricChip({
  value,
  active,
}: MetricCount) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "1px 8px",
        borderRadius: 9999,
        background: active
          ? "rgba(255,255,255,0.2)"
          : "var(--color-surface-container-high)",
        color: active ? "#fff" : "var(--color-text-primary)",
        fontSize: 11,
        fontWeight: 700,
        minWidth: 22,
        justifyContent: "center",
      }}
    >
      {value.toLocaleString("en-IN")}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export const RidesPage: React.FC = () => {
  const [tab, setTab] = useState<RideStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [rides, setRides] = useState<RideListItem[]>([]);
  const [metrics, setMetrics] = useState<RideMetrics>({
    liveRides: 0,
    upcomingRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalRides: 0,
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<RideServiceStatus | null>(
    null
  );

  // Debounce search input (300ms)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  // Reset page on tab change
  const handleTabChange = useCallback((newTab: RideStatusFilter) => {
    setTab(newTab);
    setPage(1);
  }, []);

  // Fetch rides
  const fetchRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRides({
        status: tab,
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setRides(data.rides);
      setMetrics(data.metrics);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
      if (data.serviceStatus) setServiceStatus(data.serviceStatus);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? "Failed to load rides.");
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearch, page]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Pagination helpers
  const hasPrev = page > 1;
  const hasNext = page < pages;

  function buildPageNumbers() {
    if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, null, pages];
    if (page >= pages - 2) return [1, null, pages - 2, pages - 1, pages];
    return [1, null, page - 1, page, page + 1, null, pages];
  }

  return (
    <div className="admin-page-root">
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Rides</h1>
          <p className="admin-page-subtitle">
            Monitor and manage PickMe rides across Indian metro corridors.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignSelf: "flex-start" }}>
          <button
            className="admin-btn admin-btn-secondary"
            type="button"
            disabled
            title="Export available once ride persistence is active"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
            >
              download
            </span>
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Phase C Notice Banner ── */}
      {serviceStatus && !serviceStatus.persisted && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--color-surface-container)",
            border: "1px solid var(--color-border)",
            fontSize: 13,
            color: "var(--color-text-secondary)",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "var(--color-primary)", flexShrink: 0, marginTop: 1 }}
          >
            info
          </span>
          <span>
            <strong style={{ color: "var(--color-text-primary)" }}>
              Phase C — Ride Persistence:
            </strong>{" "}
            {serviceStatus.message}
          </span>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 4,
          flexWrap: "nowrap",
        }}
      >
        {TAB_CONFIG.map(({ key, label, metricKey, pulse }) => {
          const isActive = tab === key;
          const count = metrics[metricKey];
          return (
            <button
              key={key}
              id={`rides-tab-${key}`}
              type="button"
              onClick={() => handleTabChange(key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
                background: isActive
                  ? "var(--color-primary)"
                  : "var(--color-surface-container-low)",
                color: isActive ? "#fff" : "var(--color-text-primary)",
                boxShadow: isActive
                  ? "0 2px 8px rgba(8,83,0,0.18)"
                  : "none",
              }}
            >
              {pulse && key === "live" && (
                <span style={{ position: "relative", display: "flex", width: 8, height: 8 }}>
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: isActive
                        ? "rgba(255,255,255,0.7)"
                        : "var(--color-primary)",
                      animation: "pickme-pulse 1.5s infinite",
                    }}
                  />
                  <span
                    style={{
                      position: "relative",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: isActive ? "#fff" : "var(--color-primary)",
                    }}
                  />
                </span>
              )}
              {label}
              <MetricChip value={count} active={isActive} />
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Bar ── */}
      <div
        className="admin-card"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "12px 16px",
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 200 }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              color: "var(--color-text-secondary)",
              pointerEvents: "none",
            }}
          >
            search
          </span>
          <input
            id="rides-search"
            type="text"
            placeholder="Search by ride ID, passenger, driver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: 40,
              paddingLeft: 40,
              paddingRight: 14,
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-container-low)",
              color: "var(--color-text-primary)",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--color-primary)";
              e.target.style.boxShadow = "0 0 0 3px rgba(8,83,0,0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--color-border)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ position: "relative", minWidth: 140 }}>
          <select
            id="rides-filter-status"
            value={tab}
            onChange={(e) => handleTabChange(e.target.value as RideStatusFilter)}
            style={{
              width: "100%",
              height: 40,
              paddingLeft: 12,
              paddingRight: 32,
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-container-low)",
              color: "var(--color-text-primary)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              appearance: "none",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="live">Live</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              color: "var(--color-text-secondary)",
              pointerEvents: "none",
            }}
          >
            expand_more
          </span>
        </div>

        {/* Vehicle Filter */}
        <div style={{ position: "relative", minWidth: 130 }}>
          <select
            id="rides-filter-vehicle"
            style={{
              width: "100%",
              height: 40,
              paddingLeft: 12,
              paddingRight: 32,
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-container-low)",
              color: "var(--color-text-primary)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              appearance: "none",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option>All Vehicles</option>
            <option>Auto</option>
            <option>Sedan</option>
            <option>Car</option>
            <option>Bike</option>
            <option>SUV</option>
          </select>
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              color: "var(--color-text-secondary)",
              pointerEvents: "none",
            }}
          >
            expand_more
          </span>
        </div>

        {/* Mode Filter */}
        <div style={{ position: "relative", minWidth: 120 }}>
          <select
            id="rides-filter-mode"
            style={{
              width: "100%",
              height: 40,
              paddingLeft: 12,
              paddingRight: 32,
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-container-low)",
              color: "var(--color-text-primary)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              appearance: "none",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option>All Modes</option>
            <option>Shared</option>
            <option>Personal</option>
          </select>
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              color: "var(--color-text-secondary)",
              pointerEvents: "none",
            }}
          >
            expand_more
          </span>
        </div>
      </div>

      {/* ── Main Table Card ── */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Loading State */}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 240,
              gap: 10,
              color: "var(--color-text-secondary)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 22,
                animation: "pickme-spin 1s linear infinite",
                color: "var(--color-primary)",
              }}
            >
              progress_activity
            </span>
            <span style={{ fontSize: 14 }}>Loading rides…</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 240,
              gap: 10,
              color: "var(--color-error)",
              padding: 32,
              textAlign: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 36 }}>
              error_outline
            </span>
            <p style={{ fontSize: 14 }}>{error}</p>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={fetchRides}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {/* Phase C Empty State (API connected, no data yet) */}
        {!loading && !error && serviceStatus && !serviceStatus.persisted && (
          <PhaseCBanner serviceStatus={serviceStatus} />
        )}


        {/* Data Table */}
        {!loading && !error && rides.length > 0 && (
          <>
            {/* Unified table visible on all sizes */}
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table" aria-label="Rides list">
                <thead>
                  <tr>
                    <th scope="col">RIDE ID</th>
                    <th scope="col">PASSENGER</th>
                    <th scope="col">DRIVER</th>
                    <th scope="col">ROUTE</th>
                    <th scope="col">VEHICLE</th>
                    <th scope="col" style={{ textAlign: "center" }}>MODE</th>
                    <th scope="col" style={{ textAlign: "right" }}>FARE</th>
                    <th scope="col" style={{ textAlign: "center" }}>STATUS</th>
                    <th scope="col" style={{ textAlign: "right" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride, idx) => (
                    <tr
                      key={ride.id}
                      style={{
                        background:
                          idx % 2 === 1
                            ? "rgba(229,238,255,0.2)"
                            : "transparent",
                      }}
                    >
                      {/* Ride ID */}
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "var(--color-primary)",
                          }}
                        >
                          #{ride.rideId}
                        </span>
                      </td>

                      {/* Passenger */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="admin-avatar">
                            {avatarInitials(ride.passenger?.name || "")}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {ride.passenger?.name || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Driver */}
                      <td>
                        {ride.driver ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              className="admin-avatar"
                              style={{ background: "var(--color-surface-container)" }}
                            >
                              {avatarInitials(ride.driver.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {ride.driver.name}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                                {ride.driver.vehicleModel}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Route */}
                      <td>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 13,
                          }}
                        >
                          {ride.pickup}
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, color: "var(--color-text-secondary)" }}
                          >
                            arrow_forward
                          </span>
                          {ride.dropoff}
                        </span>
                      </td>

                      {/* Vehicle */}
                      <td>
                        <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
                          {ride.vehicleType || "—"}
                        </span>
                      </td>

                      {/* Mode */}
                      <td style={{ textAlign: "center" }}>{modeBadge(ride.mode)}</td>

                      {/* Fare */}
                      <td style={{ textAlign: "right", fontWeight: 700, fontSize: 13 }}>
                        {ride.fare != null ? `₹${ride.fare}` : "—"}
                      </td>

                      {/* Status */}
                      <td style={{ textAlign: "center" }}>{statusBadge(ride.status)}</td>

                      {/* Action */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: "4px 12px", fontSize: 12 }}
                          type="button"
                          disabled
                          title="Ride details available in Phase C"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div
              className="admin-pagination-bar"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 16px",
                background: "rgba(229,238,255,0.18)",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                Showing{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {(page - 1) * PAGE_SIZE + 1}
                </strong>{" "}
                to{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {Math.min(page * PAGE_SIZE, total)}
                </strong>{" "}
                of{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {total.toLocaleString("en-IN")}
                </strong>{" "}
                rides
              </span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  className="admin-btn admin-btn-secondary"
                  style={{ gap: 4, padding: "4px 10px", fontSize: 12 }}
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => p - 1)}
                  type="button"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    chevron_left
                  </span>
                  Previous
                </button>
                {buildPageNumbers().map((p, idx) =>
                  p === null ? (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{
                        padding: "0 4px",
                        color: "var(--color-text-secondary)",
                        fontSize: 13,
                      }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p as number)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                        fontWeight: 600,
                        background:
                          p === page
                            ? "var(--color-primary)"
                            : "transparent",
                        color:
                          p === page ? "#fff" : "var(--color-text-primary)",
                        transition: "background 0.15s",
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  className="admin-btn admin-btn-secondary"
                  style={{ gap: 4, padding: "4px 10px", fontSize: 12 }}
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  type="button"
                >
                  Next
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
