import React, { useState, useEffect, useCallback, useRef } from "react";
import { getScheduledRides } from "../api/scheduled-rides";
import type {
  ScheduledRideListItem,
  ScheduledRideMetrics,
  ScheduledRideStatusFilter,
  ScheduledRideServiceStatus,
} from "../types/scheduled-rides";
import type { ApiError } from "../types/auth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This Week" },
  { value: "all", label: "All Dates" },
];

const STATUS_FILTER_OPTIONS: { key: ScheduledRideStatusFilter; label: string }[] = [
  { key: "all", label: "All Statuses" },
  { key: "assigned", label: "Assigned" },
  { key: "confirmed", label: "Confirmed" },
  { key: "scheduled", label: "Scheduled" },
  { key: "cancelled", label: "Cancelled" },
];

// Accent bar color per status (left border of time cell)
function accentColor(status: ScheduledRideListItem["status"]): string {
  switch (status) {
    case "assigned":
      return "var(--color-primary, #085300)";
    case "confirmed":
      return "#48e32e"; // secondary-fixed
    case "scheduled":
      return "var(--color-border, #bfcab7)";
    case "cancelled":
      return "var(--color-error, #ba1a1a)";
    default:
      return "var(--color-border)";
  }
}

function statusBadge(status: ScheduledRideListItem["status"]) {
  switch (status) {
    case "assigned":
      return (
        <span className="admin-badge admin-badge-success">
          <span className="admin-badge-dot" />
          Assigned
        </span>
      );
    case "confirmed":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            borderRadius: 9999,
            background: "var(--color-surface-container-high)",
            color: "var(--color-primary)",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#48e32e",
              flexShrink: 0,
            }}
          />
          Confirmed
        </span>
      );
    case "scheduled":
      return (
        <span className="admin-badge admin-badge-neutral">
          <span className="admin-badge-dot" />
          Scheduled
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

function avatarInitials(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatScheduledTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  let dateLabel: string;
  if (isToday) dateLabel = "Today";
  else if (isTomorrow) dateLabel = "Tomorrow";
  else
    dateLabel = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

  return { date: dateLabel, time: timeStr };
}

function timeFromNow(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "Overdue";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `In ${mins} min${mins !== 1 ? "s" : ""}`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) {
    return remMins > 0 ? `In ${hrs}h ${remMins}m` : `In ${hrs}h`;
  }
  const days = Math.floor(hrs / 24);
  return `In ${days} day${days !== 1 ? "s" : ""}`;
}

const PAGE_SIZE = 10;

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: string;
  iconColor?: string;
  suffix?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  iconColor,
  suffix,
}) => (
  <div
    className="admin-card"
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      gap: 8,
      padding: "14px 16px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--color-text-secondary)",
        }}
      >
        {label}
      </span>
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 20, color: iconColor || "var(--color-primary)" }}
      >
        {icon}
      </span>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--color-text-primary)",
          lineHeight: 1,
        }}
      >
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </span>
      {suffix && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--color-primary)",
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  </div>
);

// ─── Phase C Empty State ──────────────────────────────────────────────────────

const PhaseCEmptyState: React.FC<{ serviceStatus: ScheduledRideServiceStatus }> = ({
  serviceStatus,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 300,
      gap: 16,
      padding: "48px 32px",
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: "var(--color-surface-container-high)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 30, color: "var(--color-primary)" }}
      >
        event_upcoming
      </span>
    </div>
    <div>
      <p
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "var(--color-text-primary)",
          marginBottom: 8,
        }}
      >
        Scheduled Rides Not Yet Persisted
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--color-text-secondary)",
          maxWidth: 460,
          lineHeight: 1.65,
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
        padding: "5px 14px",
        borderRadius: 9999,
        background: "var(--color-surface-container)",
        color: "var(--color-text-secondary)",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        schedule
      </span>
      {serviceStatus.phase}
    </span>
  </div>
);

// ─── Select Dropdown ──────────────────────────────────────────────────────────

const FilterSelect: React.FC<{
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  minWidth?: number;
}> = ({ id, value, onChange, options, minWidth = 130 }) => (
  <div style={{ position: "relative", minWidth }}>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
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
);

// ─── Component ───────────────────────────────────────────────────────────────

export const ScheduledRidesPage: React.FC = () => {
  const [statusFilter, setStatusFilter] =
    useState<ScheduledRideStatusFilter>("all");
  const [dateRange, setDateRange] = useState("today");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [rides, setRides] = useState<ScheduledRideListItem[]>([]);
  const [metrics, setMetrics] = useState<ScheduledRideMetrics>({
    totalScheduled: 0,
    assigned: 0,
    confirmed: 0,
    pendingMatch: 0,
    cancelled: 0,
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] =
    useState<ScheduledRideServiceStatus | null>(null);

  // Debounce search (300ms)
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

  const fetchRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScheduledRides({
        status: statusFilter,
        search: debouncedSearch || undefined,
        dateRange,
        page,
        limit: PAGE_SIZE,
      });
      setRides(data.scheduledRides);
      setMetrics(data.metrics);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
      if (data.serviceStatus) setServiceStatus(data.serviceStatus);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? "Failed to load scheduled rides.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, dateRange, page]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const hasPrev = page > 1;
  const hasNext = page < pages;

  function buildPageNumbers() {
    if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, null, pages];
    if (page >= pages - 2)
      return [1, null, pages - 2, pages - 1, pages];
    return [1, null, page - 1, page, page + 1, null, pages];
  }

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="admin-page-root">
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#48e32e",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
              }}
            >
              Corridor Pre-Dispatch
            </span>
          </div>
          <h1 className="admin-page-title">Scheduled Rides</h1>
          <p className="admin-page-subtitle">
            Monitor and re-balance upcoming scheduled trips across active metro hubs.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, alignSelf: "flex-start" }}>
          <button
            className="admin-btn admin-btn-secondary"
            type="button"
            disabled
            title="Export available once scheduled ride persistence is active"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-primary)" }}>
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
            style={{
              fontSize: 18,
              color: "var(--color-primary)",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            info
          </span>
          <span>
            <strong style={{ color: "var(--color-text-primary)" }}>
              Phase C — Scheduled Ride Persistence:
            </strong>{" "}
            {serviceStatus.message}
          </span>
        </div>
      )}

      {/* ── Metrics Strip ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        <MetricCard
          label="Total Pre-Booked"
          value={metrics.totalScheduled}
          icon="event_available"
          suffix={metrics.totalScheduled === 0 ? undefined : "+0% vs y'day"}
        />
        <MetricCard
          label="Driver Match Pending"
          value={metrics.pendingMatch}
          icon="swap_horiz"
          iconColor="var(--color-text-secondary)"
          suffix={metrics.pendingMatch === 0 ? undefined : "Auto-matches queued"}
        />
        <MetricCard
          label="Assigned"
          value={metrics.assigned}
          icon="check_circle"
        />
        <MetricCard
          label="Confirmed"
          value={metrics.confirmed}
          icon="event_available"
          suffix={undefined}
        />
      </div>

      {/* ── Filter Bar ── */}
      <div
        className="admin-card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "12px 16px",
        }}
      >
        {/* Date presets + current date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "var(--color-surface-container-low)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: "var(--color-primary)" }}
            >
              calendar_today
            </span>
            {todayLabel}
          </div>

          {/* Date preset pills */}
          <div
            style={{
              display: "flex",
              background: "var(--color-surface-container)",
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                id={`scheduled-date-${opt.value}`}
                onClick={() => {
                  setDateRange(opt.value);
                  setPage(1);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 700,
                  transition: "background 0.12s, color 0.12s",
                  background:
                    dateRange === opt.value
                      ? "var(--color-surface-container-lowest)"
                      : "transparent",
                  color:
                    dateRange === opt.value
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                  boxShadow:
                    dateRange === opt.value
                      ? "0 1px 4px rgba(0,0,0,0.08)"
                      : "none",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: 10,
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
              id="scheduled-search"
              type="text"
              placeholder="Search by ID, passenger, driver, route…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                paddingLeft: 36,
                paddingRight: 12,
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-container-low)",
                color: "var(--color-text-primary)",
                fontSize: 13,
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

          <FilterSelect
            id="scheduled-filter-status"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as ScheduledRideStatusFilter);
              setPage(1);
            }}
            options={STATUS_FILTER_OPTIONS.map((o) => ({
              value: o.key,
              label: o.label,
            }))}
            minWidth={140}
          />

          <FilterSelect
            id="scheduled-filter-vehicle"
            value="all"
            onChange={() => {}}
            options={[
              { value: "all", label: "All Vehicles" },
              { value: "auto", label: "Auto (3-Wheeler)" },
              { value: "sedan", label: "Sedan Prime" },
              { value: "suv", label: "SUV Pro" },
              { value: "ev", label: "Mini EV" },
            ]}
            minWidth={140}
          />

          <FilterSelect
            id="scheduled-filter-mode"
            value="all"
            onChange={() => {}}
            options={[
              { value: "all", label: "All Modes" },
              { value: "shared", label: "Shared (Pool)" },
              { value: "personal", label: "Personal (Solo)" },
            ]}
            minWidth={140}
          />

          {/* Reset filters button */}
          <button
            type="button"
            title="Reset Filters"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setDateRange("today");
              setPage(1);
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-container-low)",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "color 0.15s, background 0.15s",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              filter_alt_off
            </span>
          </button>
        </div>
      </div>

      {/* ── Main Table Card ── */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Loading */}
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
            <span style={{ fontSize: 14 }}>Loading scheduled rides…</span>
          </div>
        )}

        {/* Error */}
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

        {/* Phase C Empty State */}
        {!loading && !error && serviceStatus && !serviceStatus.persisted && (
          <PhaseCEmptyState serviceStatus={serviceStatus} />
        )}

        {/* Regular Empty State (when persisted but no matches) */}
        {!loading && !error && (!serviceStatus || serviceStatus.persisted) && rides.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 240,
              gap: 8,
              padding: 32,
              color: "var(--color-text-secondary)",
              textAlign: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 36 }}>
              event_busy
            </span>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>
              No scheduled rides found
            </p>
            <p style={{ fontSize: 13 }}>
              Try adjusting your date range, status, or search filters.
            </p>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && rides.length > 0 && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table" aria-label="Scheduled rides list">
                <thead>
                  <tr>
                    <th scope="col">Scheduled Time</th>
                    <th scope="col">Passenger &amp; ID</th>
                    <th scope="col">Corridor Route</th>
                    <th scope="col">Vehicle &amp; Mode</th>
                    <th scope="col">Assigned Driver</th>
                    <th scope="col">Status</th>
                    <th scope="col" style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride) => {
                    const { date, time } = formatScheduledTime(ride.scheduledAt);
                    const isCancelled = ride.status === "cancelled";
                    return (
                      <tr
                        key={ride.id}
                        style={{ opacity: isCancelled ? 0.72 : 1 }}
                      >
                        {/* Scheduled Time */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                width: 4,
                                height: 24,
                                borderRadius: 2,
                                background: accentColor(ride.status),
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <p
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13,
                                  textDecoration: isCancelled ? "line-through" : "none",
                                  color: "var(--color-text-primary)",
                                }}
                              >
                                {date}, {time}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: isCancelled
                                    ? "var(--color-error)"
                                    : "var(--color-primary)",
                                  fontWeight: 500,
                                }}
                              >
                                {isCancelled
                                  ? ride.cancelReason || "Cancelled"
                                  : timeFromNow(ride.scheduledAt)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Passenger */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="admin-avatar">
                              {avatarInitials(ride.passenger?.name || "")}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 13 }}>
                                {ride.passenger?.name || "—"}
                              </p>
                              <p style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                                {ride.passenger?.phoneNumber || ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Route */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                            <span style={{ fontWeight: 500 }}>{ride.pickup}</span>
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 14, color: "var(--color-text-secondary)" }}
                            >
                              east
                            </span>
                            <span style={{ fontWeight: 500 }}>{ride.dropoff}</span>
                          </div>
                          {ride.distanceKm != null && (
                            <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                              {ride.distanceKm} km
                            </p>
                          )}
                        </td>

                        {/* Vehicle & Mode */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 16, color: "var(--color-primary)" }}
                            >
                              directions_car
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>
                              {ride.vehicleType || "—"}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              color:
                                ride.mode === "shared"
                                  ? "var(--color-primary)"
                                  : "var(--color-text-secondary)",
                              fontWeight: 600,
                            }}
                          >
                            {ride.mode === "shared" ? "Shared Corridor" : "Personal (Solo)"}
                          </span>
                        </td>

                        {/* Driver */}
                        <td>
                          {ride.driver ? (
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 13 }}>
                                {ride.driver.name}
                              </p>
                              <p style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                                {ride.driver.vehiclePlate} • {ride.driver.vehicleModel}
                              </p>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                color: "var(--color-text-secondary)",
                                fontSize: 12,
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 14 }}
                              >
                                schedule
                              </span>
                              <span style={{ fontStyle: "italic" }}>
                                {isCancelled ? "None (Discharged)" : "Auto-match prior"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td>{statusBadge(ride.status)}</td>

                        {/* Actions */}
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                            <button
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: "4px 10px", fontSize: 12 }}
                              type="button"
                              disabled
                              title="Details available in Phase C"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination + Legend */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 16px",
                background: "var(--color-surface-container-low)",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  Showing{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {(page - 1) * PAGE_SIZE + 1}
                  </strong>{" "}
                  –{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {Math.min(page * PAGE_SIZE, total)}
                  </strong>{" "}
                  of{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {total.toLocaleString("en-IN")}
                  </strong>{" "}
                  scheduled rides
                </span>
                {/* Legend */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    fontSize: 11,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {[
                    { color: "var(--color-primary)", label: "Assigned" },
                    { color: "#48e32e", label: "Confirmed" },
                    { color: "var(--color-border)", label: "Scheduled" },
                  ].map(({ color, label }) => (
                    <span
                      key={label}
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: color,
                          flexShrink: 0,
                        }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => p - 1)}
                  style={{
                    padding: "6px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    cursor: hasPrev ? "pointer" : "default",
                    opacity: hasPrev ? 1 : 0.4,
                    color: "var(--color-text-secondary)",
                    display: "flex",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    chevron_left
                  </span>
                </button>
                {buildPageNumbers().map((p, idx) =>
                  p === null ? (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{
                        padding: "0 4px",
                        color: "var(--color-text-secondary)",
                        fontSize: 12,
                      }}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p as number)}
                      style={{
                        minWidth: 30,
                        height: 30,
                        padding: "0 6px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                        fontWeight: 600,
                        background:
                          p === page
                            ? "var(--color-surface-container-lowest)"
                            : "transparent",
                        color:
                          p === page
                            ? "var(--color-primary)"
                            : "var(--color-text-primary)",
                        boxShadow: p === page ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    padding: "6px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    cursor: hasNext ? "pointer" : "default",
                    opacity: hasNext ? 1 : 0.4,
                    color: "var(--color-text-secondary)",
                    display: "flex",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
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
