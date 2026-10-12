import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardOverview } from "../api/dashboard";
import type { DashboardOverviewResponse } from "../types/dashboard";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Badge } from "../components/common/Badge";

/** Format relative time from ISO string */
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export const DashboardPage: React.FC = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const adminName = admin?.name || "Operations Admin";
  const firstName = adminName.split(" ")[0] || "Admin";

  const fetchOverview = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await getDashboardOverview();
      setData(response);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard operational metrics.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Vehicle distribution calculations
  const totalFleetUnits = data?.drivers.total || 0;
  const autoUnits = data?.drivers.vehicleDistribution.auto || 0;
  const sedanUnits = data?.drivers.vehicleDistribution.sedan || 0;
  const carUnits = data?.drivers.vehicleDistribution.car || 0;
  const bikeUnits = data?.drivers.vehicleDistribution.bike || 0;
  const suvUnits = data?.drivers.vehicleDistribution.suv || 0;

  const autoPct = totalFleetUnits > 0 ? Math.round((autoUnits / totalFleetUnits) * 100) : 0;
  const sedanPct = totalFleetUnits > 0 ? Math.round((sedanUnits / totalFleetUnits) * 100) : 0;
  const carPct = totalFleetUnits > 0 ? Math.round((carUnits / totalFleetUnits) * 100) : 0;
  const bikePct = totalFleetUnits > 0 ? Math.round((bikeUnits / totalFleetUnits) * 100) : 0;
  const suvPct = totalFleetUnits > 0 ? Math.round((suvUnits / totalFleetUnits) * 100) : 0;

  return (
    <div className="pickme-dashboard-container">
      {/* ── Operational Overview Header ── */}
      <section className="pickme-dashboard-header">
        <div className="pickme-welcome-block">
          <div className="pickme-status-indicator-tag">
            <span className="pickme-pulse-ping" />
            <span>OPERATIONS COMMAND CENTER</span>
          </div>
          <h1 className="pickme-welcome-title">Good morning, {firstName}</h1>
          <p className="pickme-welcome-desc">
            Authenticated administrator session active. Real-time platform management &amp; fleet supervision.
          </p>
        </div>

        {/* Live Network & Auto-Sync Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div className="pickme-network-pill">
            <span className="pickme-network-dot" />
            <span className="pickme-network-label">Live Network: Bengaluru Urban</span>
            <span className="pickme-network-divider">•</span>
            <span className="pickme-network-status">All Systems Normal</span>
          </div>

          <button
            onClick={() => fetchOverview(true)}
            disabled={isLoading || isRefreshing}
            className="pickme-btn pickme-btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: isRefreshing ? "wait" : "pointer",
            }}
            title="Refresh operational metrics"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "16px",
                animation: isRefreshing ? "pickme-spin 1s infinite linear" : "none",
              }}
            >
              refresh
            </span>
            <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
          </button>
        </div>
      </section>

      {/* ── Loading / Error / Content ── */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "320px",
            gap: "12px",
          }}
        >
          <LoadingSpinner size="lg" message="Aggregating operational metrics..." />
        </div>
      ) : error ? (
        <div className="pickme-retry-box">
          <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "var(--color-error)" }}>
            error_outline
          </span>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Operational Sync Unavailable</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
            {error}
          </p>
          <button
            onClick={() => fetchOverview(false)}
            className="pickme-btn pickme-btn-primary"
            style={{ marginTop: "8px", padding: "8px 20px" }}
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* ── 4 Primary KPI Summary Cards ── */}
          <section className="pickme-kpi-grid">
            {/* Card 1: Driver Partners */}
            <div
              className="pickme-kpi-card"
              onClick={() => navigate("/drivers")}
              title="View Driver Management"
            >
              <div className="pickme-kpi-header">
                <span className="pickme-kpi-title">Approved Drivers</span>
                <span className="pickme-kpi-icon-box primary">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    airline_stops
                  </span>
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span className="pickme-kpi-stat">
                  {(data?.drivers.approved ?? 0).toLocaleString()}
                </span>
                <div className="pickme-kpi-footer">
                  <span style={{ color: "var(--color-primary)", fontWeight: 600, fontSize: "12px" }}>
                    {(data?.drivers.total ?? 0).toLocaleString()} Total Registered
                  </span>
                  <span style={{ color: "var(--color-text-muted)" }}>Manage &rarr;</span>
                </div>
              </div>
            </div>

            {/* Card 2: Registered Passengers */}
            <div
              className="pickme-kpi-card"
              onClick={() => navigate("/users")}
              title="View Passenger Accounts"
            >
              <div className="pickme-kpi-header">
                <span className="pickme-kpi-title">Registered Passengers</span>
                <span className="pickme-kpi-icon-box info">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    group
                  </span>
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span className="pickme-kpi-stat">
                  {(data?.passengers.total ?? 0).toLocaleString()}
                </span>
                <div className="pickme-kpi-footer">
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
                    <strong style={{ color: "var(--color-primary)" }}>{data?.passengers.active ?? 0}</strong> Active
                    {(data?.passengers.suspended ?? 0) + (data?.passengers.blocked ?? 0) > 0 && (
                      <span style={{ marginLeft: "4px", color: "var(--color-warning)" }}>
                        • {(data?.passengers.suspended ?? 0) + (data?.passengers.blocked ?? 0)} Restricted
                      </span>
                    )}
                  </span>
                  <span style={{ color: "var(--color-text-muted)" }}>Inspect &rarr;</span>
                </div>
              </div>
            </div>

            {/* Card 3: Pending Approvals */}
            <div
              className="pickme-kpi-card"
              onClick={() => navigate("/drivers")}
              title="Inspect Driver Verification Queue"
            >
              <div className="pickme-kpi-header">
                <span className="pickme-kpi-title">Pending Approvals</span>
                <span
                  className={`pickme-kpi-icon-box ${(data?.drivers.pending ?? 0) > 0 ? "warning" : "primary"}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    verified_user
                  </span>
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  className="pickme-kpi-stat"
                  style={{
                    color: (data?.drivers.pending ?? 0) > 0 ? "var(--color-warning)" : "var(--color-text-primary)",
                  }}
                >
                  {(data?.drivers.pending ?? 0).toLocaleString()}
                </span>
                <div className="pickme-kpi-footer">
                  {(data?.drivers.pending ?? 0) > 0 ? (
                    <span className="admin-badge admin-badge-warning pulsing" style={{ padding: "1px 6px" }}>
                      <span className="admin-badge-dot pulsing-dot" />
                      Verification Required
                    </span>
                  ) : (
                    <span className="admin-badge admin-badge-success" style={{ padding: "1px 6px" }}>
                      <span className="admin-badge-dot" />
                      Queue Caught Up
                    </span>
                  )}
                  <span style={{ color: "var(--color-text-muted)" }}>Review &rarr;</span>
                </div>
              </div>
            </div>

            {/* Card 4: Persisted Rides (Phase C Indicator) */}
            <div
              className="pickme-kpi-card"
              onClick={() => navigate("/rides")}
              title="Inspect Rides Console"
            >
              <div className="pickme-kpi-header">
                <span className="pickme-kpi-title">Active Rides</span>
                <span className="pickme-kpi-icon-box neutral">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    navigation
                  </span>
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span className="pickme-kpi-stat font-tabular">0</span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                      backgroundColor: "var(--color-surface-container-high)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    Phase C
                  </span>
                </div>
                <div className="pickme-kpi-footer">
                  <span style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>
                    Mobile client in-memory state
                  </span>
                  <span style={{ color: "var(--color-text-muted)" }}>Console &rarr;</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Two Column Operations Layout (60% / 40%) ── */}
          <div className="pickme-ops-layout">
            {/* LEFT COLUMN: Corridors, Activity Progression, Supply Distribution */}
            <div className="pickme-ops-main">
              {/* 1. Live Operations Corridor Summary */}
              <section className="pickme-ops-section">
                <div className="pickme-section-header">
                  <div>
                    <h2 className="pickme-section-title">Live Operations</h2>
                    <p className="pickme-section-desc">Active corridor supply vs surge balance</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="admin-badge admin-badge-live">
                      <span className="admin-badge-dot admin-badge-dot-pulse" />
                      Auto-sync 15s
                    </span>
                  </div>
                </div>

                <div className="pickme-corridor-grid">
                  {/* Corridor 1: Outer Ring Road */}
                  <div className="pickme-corridor-card">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span className="pickme-corridor-name">Outer Ring Road</span>
                        <span className="admin-badge admin-badge-success" style={{ fontSize: "10px", padding: "1px 6px" }}>
                          Balanced
                        </span>
                      </div>
                      <p className="pickme-corridor-sub">Silk Board &rlarr; Marathahalli</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>Corridor Status</p>
                        <p style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
                          Normal Flow
                        </p>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: 600 }}>0.94 Ratio</span>
                    </div>
                  </div>

                  {/* Corridor 2: Whitefield */}
                  <div className="pickme-corridor-card">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span className="pickme-corridor-name">Whitefield</span>
                        <span className="admin-badge admin-badge-success" style={{ fontSize: "10px", padding: "1px 6px" }}>
                          Optimal
                        </span>
                      </div>
                      <p className="pickme-corridor-sub">ITPL &rlarr; Hoodi Corridor</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>Corridor Status</p>
                        <p style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
                          Steady Supply
                        </p>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: 600 }}>1.25 Ratio</span>
                    </div>
                  </div>

                  {/* Corridor 3: Electronic City */}
                  <div className="pickme-corridor-card">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span className="pickme-corridor-name">Electronic City</span>
                        <span className="admin-badge admin-badge-warning" style={{ fontSize: "10px", padding: "1px 6px" }}>
                          Surge 1.4x
                        </span>
                      </div>
                      <p className="pickme-corridor-sub">Phase 1 &amp; Elevated Expressway</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>Corridor Status</p>
                        <p style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
                          Peak Demand
                        </p>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--color-warning)", fontWeight: 600 }}>0.69 Ratio</span>
                    </div>
                  </div>
                </div>

                {/* Simulated GPS Topology Grid Overlay */}
                <div className="pickme-map-strip" data-location="Outer Ring Road, Bengaluru">
                  <svg className="w-full h-full" style={{ width: "100%", height: "100%", opacity: 0.4 }} preserveAspectRatio="none" viewBox="0 0 600 120">
                    <path
                      d="M0,60 Q150,20 300,70 T600,40"
                      fill="none"
                      stroke="#085300"
                      strokeDasharray="6,4"
                      strokeWidth="3"
                    />
                    <path
                      d="M0,90 Q200,100 400,30 T600,80"
                      fill="none"
                      stroke="#707a69"
                      strokeWidth="2"
                    />
                    <circle cx="150" cy="40" r="5" fill="#085300" />
                    <circle cx="340" cy="65" r="5" fill="#085300" />
                    <circle cx="480" cy="48" r="5" fill="#ba1a1a" />
                  </svg>
                  <div className="pickme-map-badge">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--color-primary)" }}>
                      near_me
                    </span>
                    <span>Corridor Telemetry Preview • Phase C Persistent Link</span>
                  </div>
                </div>
              </section>

              {/* 2. Ride Activity Line Chart Progression */}
              <section className="pickme-ops-section">
                <div className="pickme-section-header">
                  <div>
                    <h2 className="pickme-section-title">Ride Activity Telemetry</h2>
                    <p className="pickme-section-desc">Hourly volume distribution progression (06:00 to 22:00 IST)</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="admin-badge admin-badge-neutral">
                      Phase C Scheduled
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "10px", height: "3px", borderRadius: "2px", background: "var(--color-primary)" }} />
                      <span style={{ fontSize: "12px", color: "var(--color-text-primary)", fontWeight: 500 }}>Target Flow</span>
                    </div>
                  </div>
                </div>

                <div className="pickme-chart-container">
                  <div style={{ width: "100%", height: "140px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <svg style={{ width: "100%", height: "120px", overflow: "visible" }} preserveAspectRatio="none" viewBox="0 0 700 140">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#085300" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#085300" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Quiet horizontal grid lines */}
                      <line stroke="#e5eeff" strokeWidth="1" x1="0" x2="700" y1="20" y2="20" />
                      <line stroke="#e5eeff" strokeWidth="1" x1="0" x2="700" y1="60" y2="60" />
                      <line stroke="#e5eeff" strokeWidth="1" x1="0" x2="700" y1="100" y2="100" />
                      {/* Area fill */}
                      <path
                        d="M 0,110 Q 70,105 140,40 T 280,60 T 420,80 T 560,35 T 700,90 L 700,140 L 0,140 Z"
                        fill="url(#chartGradient)"
                      />
                      {/* Smooth line */}
                      <path
                        d="M 0,110 Q 70,105 140,40 T 280,60 T 420,80 T 560,35 T 700,90"
                        fill="none"
                        stroke="#085300"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                      {/* Selected peak point indicator */}
                      <circle cx="560" cy="35" r="4.5" fill="#085300" />
                      <circle cx="560" cy="35" r="9" fill="none" stroke="#64fe48" strokeWidth="2.5" />
                    </svg>
                  </div>

                  {/* Timeline X-Axis */}
                  <div className="pickme-chart-timeline">
                    <span>06:00</span>
                    <span>08:00</span>
                    <span>10:00</span>
                    <span>12:00</span>
                    <span>14:00</span>
                    <span>16:00</span>
                    <span>18:00</span>
                    <span>20:00</span>
                    <span>22:00</span>
                  </div>
                </div>

                <div className="pickme-phase-advisory">
                  <span className="material-symbols-outlined pickme-phase-advisory-icon">
                    info
                  </span>
                  <div>
                    <h4 className="pickme-phase-advisory-title">Telemetry Persistence Architecture</h4>
                    <p className="pickme-phase-advisory-desc">
                      Live ride lifecycle currently runs through client-side mobile app state. Full MongoDB database storage for individual trip legs, GPS breadcrumbs, and hourly aggregates will activate in Phase C (Ride Dispatch &amp; Lifecycle).
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. Vehicle Supply Distribution */}
              <section className="pickme-ops-section">
                <div className="pickme-section-header">
                  <div>
                    <h2 className="pickme-section-title">Vehicle Supply Distribution</h2>
                    <p className="pickme-section-desc">Composition across registered driver partners</p>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {totalFleetUnits} Total {totalFleetUnits === 1 ? "Unit" : "Units"}
                  </span>
                </div>

                {totalFleetUnits === 0 ? (
                  <div
                    style={{
                      background: "var(--color-surface-low)",
                      borderRadius: "8px",
                      padding: "20px",
                      textAlign: "center",
                      color: "var(--color-text-secondary)",
                      fontSize: "13px",
                    }}
                  >
                    No driver vehicles registered yet in the database. When driver partners submit verification profiles, vehicle categories will populate here automatically.
                  </div>
                ) : (
                  <>
                    {/* Stacked Horizontal Proportion Bar */}
                    <div className="pickme-distribution-bar">
                      {autoPct > 0 && (
                        <div
                          className="pickme-distribution-segment"
                          style={{ width: `${autoPct}%`, backgroundColor: "#085300" }}
                          title={`Auto: ${autoUnits} (${autoPct}%)`}
                        />
                      )}
                      {sedanPct > 0 && (
                        <div
                          className="pickme-distribution-segment"
                          style={{ width: `${sedanPct}%`, backgroundColor: "#0d6e00" }}
                          title={`Sedan: ${sedanUnits} (${sedanPct}%)`}
                        />
                      )}
                      {carPct > 0 && (
                        <div
                          className="pickme-distribution-segment"
                          style={{ width: `${carPct}%`, backgroundColor: "#2563eb" }}
                          title={`Car: ${carUnits} (${carPct}%)`}
                        />
                      )}
                      {bikePct > 0 && (
                        <div
                          className="pickme-distribution-segment"
                          style={{ width: `${bikePct}%`, backgroundColor: "#7c3aed" }}
                          title={`Bike: ${bikeUnits} (${bikePct}%)`}
                        />
                      )}
                      {suvPct > 0 && (
                        <div
                          className="pickme-distribution-segment"
                          style={{ width: `${suvPct}%`, backgroundColor: "#d97706" }}
                          title={`SUV: ${suvUnits} (${suvPct}%)`}
                        />
                      )}
                    </div>

                    {/* Segment Breakdown Indicators */}
                    <div className="pickme-distribution-legends">
                      <div className="pickme-legend-item">
                        <span className="pickme-legend-dot" style={{ backgroundColor: "#085300" }} />
                        <div>
                          <p className="pickme-legend-label">Auto • {autoPct}%</p>
                          <p className="pickme-legend-val">{autoUnits} units</p>
                        </div>
                      </div>

                      <div className="pickme-legend-item">
                        <span className="pickme-legend-dot" style={{ backgroundColor: "#0d6e00" }} />
                        <div>
                          <p className="pickme-legend-label">Sedan • {sedanPct}%</p>
                          <p className="pickme-legend-val">{sedanUnits} units</p>
                        </div>
                      </div>

                      <div className="pickme-legend-item">
                        <span className="pickme-legend-dot" style={{ backgroundColor: "#2563eb" }} />
                        <div>
                          <p className="pickme-legend-label">Car • {carPct}%</p>
                          <p className="pickme-legend-val">{carUnits} units</p>
                        </div>
                      </div>

                      <div className="pickme-legend-item">
                        <span className="pickme-legend-dot" style={{ backgroundColor: "#7c3aed" }} />
                        <div>
                          <p className="pickme-legend-label">Bike • {bikePct}%</p>
                          <p className="pickme-legend-val">{bikeUnits} units</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>

            {/* RIGHT COLUMN: Pending Verification Queue & Quick Health Summary */}
            <div className="pickme-ops-side">
              {/* Pending Operational Queue */}
              <section className="pickme-ops-section">
                <div className="pickme-section-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h2 className="pickme-section-title">Pending Actions</h2>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        backgroundColor: (data?.drivers.pending ?? 0) > 0 ? "var(--color-error-container)" : "var(--color-surface-container)",
                        color: (data?.drivers.pending ?? 0) > 0 ? "var(--color-on-error-container)" : "var(--color-text-secondary)",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {data?.drivers.pending ?? 0}
                    </span>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    {(data?.drivers.pending ?? 0) > 0 ? "High Attention" : "All Clear"}
                  </span>
                </div>

                <div className="pickme-queue-list">
                  {data?.recentActivity && data.recentActivity.length > 0 ? (
                    data.recentActivity.map((item) => {
                      const isPending = item.verificationStatus === "pending";
                      return (
                        <div key={item.id} className="pickme-queue-item">
                          <div className="pickme-queue-top">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                              <div
                                className="pickme-queue-avatar"
                                style={{
                                  backgroundColor: isPending ? "rgba(217, 119, 6, 0.12)" : "rgba(13, 110, 0, 0.12)",
                                  color: isPending ? "var(--color-warning)" : "var(--color-primary)",
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                  {isPending ? "badge" : "verified"}
                                </span>
                              </div>
                              <div className="pickme-queue-info">
                                <p className="pickme-queue-name">
                                  {item.driverName} ({item.vehicleType.toUpperCase()})
                                </p>
                                <p className="pickme-queue-meta">
                                  Plate: {item.vehicleNumber || "Pending"} • {formatRelativeTime(item.createdAt)}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`admin-badge ${
                                isPending
                                  ? "admin-badge-warning pulsing"
                                  : item.verificationStatus === "approved"
                                  ? "admin-badge-success"
                                  : "admin-badge-error"
                              }`}
                              style={{ fontSize: "10px", padding: "1px 6px" }}
                            >
                              {isPending ? "Review Pending" : item.verificationStatus.toUpperCase()}
                            </span>
                          </div>

                          <div className="pickme-queue-bottom">
                            <span className="pickme-queue-time">
                              {isPending ? "Verification Queue" : "Profile Active"}
                            </span>
                            <button
                              onClick={() => navigate(`/drivers/${item.id}/verify`)}
                              className="pickme-queue-btn"
                              type="button"
                            >
                              {isPending ? "Review Docs" : "Inspect"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        padding: "24px 16px",
                        textAlign: "center",
                        background: "var(--color-surface-low)",
                        borderRadius: "8px",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--color-primary)" }}>
                        check_circle
                      </span>
                      <p style={{ margin: "6px 0 0", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        Verification Queue Clear
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>
                        No driver verification requests currently awaiting administrative review.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Quick Dispatch Health & Clearance Summary Box */}
              <section className="pickme-ops-section">
                <div className="pickme-section-header">
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                    Platform Health &amp; Security
                  </span>
                  <span className="admin-badge admin-badge-success">
                    Active Clearance
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Administrator Session</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{admin?.email || "prathibanshiva@gmail.com"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Clearance Level</span>
                    <Badge variant="primary">{admin?.role || "admin"}</Badge>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Database Connectivity</span>
                    <span style={{ color: "var(--color-success)", fontWeight: 600 }}>Connected (MongoDB)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Ride Persistence Engine</span>
                    <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Scheduled (Phase C)</span>
                  </div>
                </div>

                <div style={{ width: "100%", height: "4px", backgroundColor: "var(--color-surface-container)", borderRadius: "2px", overflow: "hidden", marginTop: "4px" }}>
                  <div style={{ width: "100%", height: "100%", backgroundColor: "var(--color-primary)", borderRadius: "2px" }} />
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
