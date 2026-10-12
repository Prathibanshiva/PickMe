import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getPassengers,
  getPassengerById,
  updatePassengerStatus,
} from "../api/passengers";
import type {
  PassengerListItem,
  PassengerDetail,
  PassengerStatusFilter,
  AccountAction,
  AccountAuditAttribution,
} from "../types/passengers";
import type { ApiError } from "../types/auth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TAB_LABELS: { key: PassengerStatusFilter; label: string }[] = [
  { key: "all", label: "All Passengers" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "blocked", label: "Blocked" },
];

function accountBadge(passenger: PassengerListItem | PassengerDetail) {
  if (passenger.isBlocked) {
    return (
      <span className="admin-badge admin-badge-error">
        <span className="admin-badge-dot" />
        Blocked
      </span>
    );
  }
  if (passenger.isSuspended) {
    return (
      <span className="admin-badge admin-badge-warning">
        <span className="admin-badge-dot" />
        Suspended
      </span>
    );
  }
  return (
    <span className="admin-badge admin-badge-success">
      <span className="admin-badge-dot" />
      Active
    </span>
  );
}

/** Derive initials avatar from passenger name or phone */
function initials(name: string, phone: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (phone) return phone.slice(-2);
  return "PA";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 10;

// ─── Component ───────────────────────────────────────────────────────────────

export const PassengersPage: React.FC = () => {
  const [tab, setTab] = useState<PassengerStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [passengers, setPassengers] = useState<PassengerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected passenger for detail drawer
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPassenger, setSelectedPassenger] =
    useState<PassengerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Account status management state in drawer
  const [confirmingAction, setConfirmingAction] = useState<AccountAction | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [statusActionInProgress, setStatusActionInProgress] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [statusActionSuccess, setStatusActionSuccess] = useState<{
    message: string;
    audit?: AccountAuditAttribution;
  } | null>(null);

  // Debounce search input (300 ms)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [tab]);

  const fetchPassengers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPassengers({
        status: tab === "all" ? undefined : tab,
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setPassengers(res.passengers);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(
        apiErr.message || "Failed to load passengers. Is the backend server running?"
      );
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearch, page]);

  useEffect(() => {
    fetchPassengers();
  }, [fetchPassengers]);

  // Load detailed passenger profile when selected
  const handleOpenDetail = async (id: string) => {
    setSelectedId(id);
    setLoadingDetail(true);
    setDetailError(null);
    setConfirmingAction(null);
    setActionReason("");
    setStatusActionError(null);
    setStatusActionSuccess(null);
    try {
      const res = await getPassengerById(id);
      setSelectedPassenger(res.passenger);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setDetailError(
        apiErr.message || "Failed to load passenger profile details."
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
    setSelectedPassenger(null);
    setDetailError(null);
    setConfirmingAction(null);
    setActionReason("");
    setStatusActionError(null);
    setStatusActionSuccess(null);
  };

  // Execute account status update (block, unblock, suspend, restore)
  const handleApplyStatusAction = async () => {
    if (!selectedPassenger || !confirmingAction) return;
    setStatusActionInProgress(true);
    setStatusActionError(null);
    setStatusActionSuccess(null);
    try {
      const res = await updatePassengerStatus(selectedPassenger.id, {
        action: confirmingAction,
        reason: actionReason.trim() || undefined,
      });

      // Synchronize drawer detail state
      setSelectedPassenger((prev) =>
        prev
          ? {
              ...prev,
              isBlocked: res.passenger.isBlocked,
              isSuspended: res.passenger.isSuspended,
              updatedAt: res.passenger.updatedAt,
            }
          : null
      );

      // Synchronize background list state
      setPassengers((prevList) =>
        prevList.map((p) =>
          p.id === selectedPassenger.id
            ? {
                ...p,
                isBlocked: res.passenger.isBlocked,
                isSuspended: res.passenger.isSuspended,
                updatedAt: res.passenger.updatedAt,
              }
            : p
        )
      );

      setStatusActionSuccess({
        message: res.message,
        audit: res.audit,
      });
      setConfirmingAction(null);
      setActionReason("");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setStatusActionError(
        apiErr.message || "Failed to update account status."
      );
    } finally {
      setStatusActionInProgress(false);
    }
  };

  return (
    <div className="drivers-page">
      {/* ── Ambient glow ── */}
      <div className="page-glow-top-right" />
      <div className="page-glow-mid-left" />

      {/* ── Page Header ── */}
      <div className="page-header-row">
        <div>
          <div className="page-eyebrow">
            <span className="material-symbols-outlined eyebrow-icon">group</span>
            <span>Rider Network</span>
          </div>
          <h1 className="page-title">Users & Passengers</h1>
          <p className="page-subtitle">
            Inspect registered passenger profiles, credentials, and network status.
          </p>
        </div>
      </div>

      {/* ── Status Tab Bar ── */}
      <div className="drivers-tab-bar">
        <div className="tab-group">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`tab-btn${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              <span>{label}</span>
              {tab === key && total > 0 && (
                <span className="tab-count">
                  {total.toLocaleString("en-IN")}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="drivers-search-row">
        <div className="search-input-wrap">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            id="passenger-search-input"
            type="text"
            className="search-input"
            placeholder="Search by passenger name, phone, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              title="Clear search"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                close
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "10px",
            marginBottom: "16px",
            color: "#991b1b",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              error
            </span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="page-btn"
            onClick={fetchPassengers}
            style={{ fontSize: "12px", padding: "4px 10px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="drivers-table-card">
        {loading && (
          <div className="table-loading-overlay">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: "3px solid #e5e7eb",
                  borderTopColor: "var(--color-primary)",
                  borderRadius: "50%",
                  animation: "pickme-spin 0.8s linear infinite",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                }}
              >
                Fetching passenger accounts…
              </span>
            </div>
          </div>
        )}

        <div className="table-scroll-wrapper">
          <table className="drivers-table">
            <thead>
              <tr>
                <th>Passenger</th>
                <th>Role</th>
                <th>Gender</th>
                <th>Registered On</th>
                <th>Account Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && passengers.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-empty-cell">
                    <div className="table-empty-state">
                      <span className="material-symbols-outlined table-empty-icon">
                        {debouncedSearch ? "person_search" : "group_off"}
                      </span>
                      <p className="table-empty-title">
                        {debouncedSearch
                          ? `No passengers found for "${debouncedSearch}"`
                          : "No passenger accounts found"}
                      </p>
                      <p className="table-empty-sub">
                        {debouncedSearch
                          ? "Try searching by a different name, phone number, or clear your query."
                          : tab !== "all"
                          ? `No passengers with status "${tab}". Try switching to All.`
                          : "Passenger registrations will populate here once mobile users sign up."}
                      </p>
                      {debouncedSearch && (
                        <button
                          type="button"
                          className="page-btn"
                          onClick={() => setSearch("")}
                          style={{ marginTop: "8px" }}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {passengers.map((passenger) => (
                <tr key={passenger.id} className="driver-row">
                  {/* Passenger Identity */}
                  <td>
                    <div className="driver-identity-cell">
                      <div className="driver-avatar">
                        {initials(passenger.name, passenger.phoneNumber)}
                        <span
                          className={`avatar-status-dot${
                            !passenger.isBlocked && !passenger.isSuspended
                              ? " dot-online"
                              : ""
                          }`}
                        />
                      </div>
                      <div>
                        <div className="driver-name">
                          {passenger.name || "Unnamed Passenger"}
                        </div>
                        <div className="driver-phone">
                          <span style={{ fontFamily: "monospace", opacity: 0.8 }}>
                            USR-{passenger.id.slice(-6).toUpperCase()}
                          </span>
                          {" • "}
                          {passenger.phoneNumber
                            ? `+91 ${passenger.phoneNumber}`
                            : "No phone"}
                        </div>
                        {passenger.email && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-muted)",
                              marginTop: "1px",
                            }}
                          >
                            {passenger.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "var(--color-surface-container, #e5eeff)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Passenger
                    </span>
                  </td>

                  {/* Gender */}
                  <td>
                    <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      {passenger.gender || "—"}
                    </span>
                  </td>

                  {/* Registration Date */}
                  <td className="joined-cell">
                    {passenger.createdAt ? formatDate(passenger.createdAt) : "—"}
                  </td>

                  {/* Account Status */}
                  <td>{accountBadge(passenger)}</td>

                  {/* Actions */}
                  <td className="text-right">
                    <div className="driver-actions">
                      <button
                        type="button"
                        className="btn-action-ghost"
                        onClick={() => handleOpenDetail(passenger.id)}
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        {!loading && total > 0 && (
          <div className="pagination-footer">
            <p className="pagination-info">
              Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
              <strong>{Math.min(page * PAGE_SIZE, total)}</strong> of{" "}
              <strong>{total.toLocaleString("en-IN")}</strong> passengers
            </p>
            <div className="pagination-controls">
              <button
                type="button"
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  chevron_left
                </span>
                Previous
              </button>

              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    className={`page-num-btn${page === p ? " active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}

              {pages > 5 && (
                <>
                  <span className="page-ellipsis">…</span>
                  <button
                    type="button"
                    className={`page-num-btn${page === pages ? " active" : ""}`}
                    onClick={() => setPage(pages)}
                  >
                    {pages}
                  </button>
                </>
              )}

              <button
                type="button"
                className="page-btn"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-Over Passenger Details Drawer ── */}
      {selectedId && (
        <>
          <div className="drawer-backdrop" onClick={handleCloseDetail} />
          <div className="drawer-panel" role="dialog" aria-modal="true">
            {/* Drawer Header */}
            <div className="drawer-header">
              <div className="drawer-header-left">
                <div className="drawer-avatar">
                  {initials(
                    selectedPassenger?.name || "",
                    selectedPassenger?.phoneNumber || ""
                  )}
                </div>
                <div className="drawer-title-group">
                  <h2 className="drawer-name">
                    {loadingDetail
                      ? "Loading Profile…"
                      : selectedPassenger?.name || "Unnamed Passenger"}
                  </h2>
                  <div className="drawer-meta-row">
                    <span className="drawer-uid-pill">
                      USR-{selectedId.slice(-6).toUpperCase()}
                    </span>
                    <span>•</span>
                    {selectedPassenger && accountBadge(selectedPassenger)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="drawer-close-btn"
                onClick={handleCloseDetail}
                title="Close Drawer"
                aria-label="Close Drawer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="drawer-body">
              {loadingDetail ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 0",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      border: "3px solid #e5e7eb",
                      borderTopColor: "var(--color-primary)",
                      borderRadius: "50%",
                      animation: "pickme-spin 0.8s linear infinite",
                    }}
                  />
                  <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
                    Loading passenger account telemetry…
                  </span>
                </div>
              ) : detailError ? (
                <div
                  style={{
                    padding: "16px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: "10px",
                    color: "#991b1b",
                    fontSize: "13px",
                  }}
                >
                  {detailError}
                </div>
              ) : selectedPassenger ? (
                <>
                  {/* Dual Registration Profile (if driver profile exists) */}
                  {selectedPassenger.driverProfile && (
                    <div className="drawer-dual-profile">
                      <div className="drawer-dual-profile-left">
                        <div className="drawer-dual-profile-icon">
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 22 }}
                          >
                            local_taxi
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#166534" }}>
                            Dual Driver Partner Registration
                          </div>
                          <div style={{ fontSize: "12px", color: "#15803d", marginTop: "2px" }}>
                            Registered vehicle:{" "}
                            <strong>
                              {selectedPassenger.driverProfile.vehicleType.toUpperCase()}
                            </strong>
                            {selectedPassenger.driverProfile.vehicleNumber
                              ? ` (${selectedPassenger.driverProfile.vehicleNumber})`
                              : ""}{" "}
                            • KYC Status:{" "}
                            <span style={{ textTransform: "capitalize" }}>
                              {selectedPassenger.driverProfile.verificationStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Account Information Card */}
                  <div className="drawer-card">
                    <h3 className="drawer-card-title">
                      <span className="material-symbols-outlined title-icon">
                        badge
                      </span>
                      Account Identity & Credentials
                    </h3>
                    <div className="drawer-grid">
                      <div className="drawer-field">
                        <span className="drawer-field-label">Mobile Number</span>
                        <span className="drawer-field-value">
                          {selectedPassenger.phoneNumber
                            ? `+91 ${selectedPassenger.phoneNumber}`
                            : "—"}
                          {selectedPassenger.phoneNumber && (
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 15, color: "var(--color-primary)" }}
                              title="Verified via mobile OTP"
                            >
                              verified
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="drawer-field">
                        <span className="drawer-field-label">Email Address</span>
                        <span className="drawer-field-value">
                          {selectedPassenger.email || "Not specified"}
                        </span>
                      </div>

                      <div className="drawer-field">
                        <span className="drawer-field-label">Gender</span>
                        <span className="drawer-field-value">
                          {selectedPassenger.gender || "Not specified"}
                        </span>
                      </div>

                      <div className="drawer-field">
                        <span className="drawer-field-label">Primary Role</span>
                        <span className="drawer-field-value">
                          {selectedPassenger.defaultRole}
                        </span>
                      </div>

                      <div className="drawer-field">
                        <span className="drawer-field-label">Registered On</span>
                        <span className="drawer-field-value">
                          {selectedPassenger.createdAt
                            ? formatDateTime(selectedPassenger.createdAt)
                            : "—"}
                        </span>
                      </div>

                      <div className="drawer-field">
                        <span className="drawer-field-label">Last Updated</span>
                        <span className="drawer-field-value">
                          {selectedPassenger.updatedAt
                            ? formatDateTime(selectedPassenger.updatedAt)
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ride History Telemetry Notice */}
                  <div className="drawer-card">
                    <h3 className="drawer-card-title">
                      <span className="material-symbols-outlined title-icon">
                        commute
                      </span>
                      Ride & Trip History
                    </h3>
                    <div className="drawer-notice-box">
                      <span className="material-symbols-outlined drawer-notice-icon">
                        schedule
                      </span>
                      <div>
                        <strong>Ride telemetry scheduled for Phase C</strong>
                        <p style={{ margin: "4px 0 0 0" }}>
                          Live ride dispatch and trip history tracking APIs are
                          under active development for Phase C. Completed passenger
                          trips, route coordinates, and billing receipts will
                          automatically stream here once activated.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Status Management & Security Governance */}
                  <div
                    className="drawer-card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <h3 className="drawer-card-title" style={{ margin: 0 }}>
                        <span className="material-symbols-outlined title-icon">
                          shield_person
                        </span>
                        Account Status &amp; Security Governance
                      </h3>
                      {accountBadge(selectedPassenger)}
                    </div>

                    {/* Operational explanation of current status */}
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: selectedPassenger.isBlocked
                          ? "var(--color-error-container, #fee2e2)"
                          : selectedPassenger.isSuspended
                          ? "#fef3c7"
                          : "var(--color-surface-container, #e8f5e9)",
                        color: selectedPassenger.isBlocked
                          ? "var(--color-error, #991b1b)"
                          : selectedPassenger.isSuspended
                          ? "#92400e"
                          : "var(--color-primary, #085300)",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "18px",
                          flexShrink: 0,
                          marginTop: "1px",
                        }}
                      >
                        {selectedPassenger.isBlocked
                          ? "gavel"
                          : selectedPassenger.isSuspended
                          ? "pause_circle"
                          : "check_circle"}
                      </span>
                      <div>
                        <strong>
                          {selectedPassenger.isBlocked
                            ? "Blocked State"
                            : selectedPassenger.isSuspended
                            ? "Suspended State"
                            : "Active State"}
                          :
                        </strong>{" "}
                        {selectedPassenger.isBlocked
                          ? "Prohibited from mobile OTP authentication and denied from all platform APIs by middleware (403 Forbidden)."
                          : selectedPassenger.isSuspended
                          ? "Temporary booking restriction active. User cannot verify OTP or access ride dispatch services until restored."
                          : "Account in good standing with standard rider access to dispatch networks and booking flows."}
                      </div>
                    </div>

                    {/* Primary Admin Guard Notice */}
                    {selectedPassenger.email?.toLowerCase() ===
                      "prathibanshiva@gmail.com" ||
                    selectedPassenger.defaultRole === "admin" ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "#e0f2fe",
                          border: "1px solid #bae6fd",
                          color: "#0369a1",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "18px" }}
                        >
                          lock
                        </span>
                        <span>
                          <strong>Protected System Account:</strong> This account
                          is the primary administrator and cannot be modified.
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Success Feedback Alert */}
                        {statusActionSuccess && (
                          <div
                            style={{
                              padding: "10px 14px",
                              borderRadius: "8px",
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "#065f46",
                              fontSize: "12px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 700,
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "16px" }}
                              >
                                check_circle
                              </span>
                              {statusActionSuccess.message}
                            </div>
                            {statusActionSuccess.audit && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#047857",
                                }}
                              >
                                Performed by{" "}
                                {statusActionSuccess.audit.performedBy.name ||
                                  "Administrator"}{" "}
                                (
                                {statusActionSuccess.audit.performedBy.email ||
                                  "Operations"}
                                ) •{" "}
                                {formatDateTime(
                                  statusActionSuccess.audit.timestamp
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Error Feedback Alert */}
                        {statusActionError && (
                          <div
                            style={{
                              padding: "10px 14px",
                              borderRadius: "8px",
                              background:
                                "var(--color-error-container, #fee2e2)",
                              border: "1px solid #fca5a5",
                              color: "var(--color-error, #991b1b)",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "16px" }}
                            >
                              error
                            </span>
                            <span>{statusActionError}</span>
                          </div>
                        )}

                        {/* Status Action Buttons */}
                        {!confirmingAction && (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                              marginTop: "4px",
                            }}
                          >
                            {/* If Active: Can Suspend or Block */}
                            {!selectedPassenger.isBlocked &&
                              !selectedPassenger.isSuspended && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmingAction("suspend");
                                      setStatusActionError(null);
                                      setStatusActionSuccess(null);
                                    }}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "8px 14px",
                                      borderRadius: "8px",
                                      border: "1px solid #f59e0b",
                                      background: "#fffbeb",
                                      color: "#b45309",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "inherit",
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    <span
                                      className="material-symbols-outlined"
                                      style={{ fontSize: "16px" }}
                                    >
                                      pause_circle
                                    </span>
                                    Suspend Account
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmingAction("block");
                                      setStatusActionError(null);
                                      setStatusActionSuccess(null);
                                    }}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "8px 14px",
                                      borderRadius: "8px",
                                      border: "1px solid #dc2626",
                                      background: "#fef2f2",
                                      color: "#b91c1c",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "inherit",
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    <span
                                      className="material-symbols-outlined"
                                      style={{ fontSize: "16px" }}
                                    >
                                      block
                                    </span>
                                    Block Account
                                  </button>
                                </>
                              )}

                            {/* If Suspended: Can Restore to Active or Block */}
                            {selectedPassenger.isSuspended && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmingAction("restore");
                                    setStatusActionError(null);
                                    setStatusActionSuccess(null);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    borderRadius: "8px",
                                    border:
                                      "1px solid var(--color-primary, #085300)",
                                    background:
                                      "var(--color-surface-container, #e8f5e9)",
                                    color: "var(--color-primary, #085300)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "16px" }}
                                  >
                                    check_circle
                                  </span>
                                  Restore to Active
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmingAction("block");
                                    setStatusActionError(null);
                                    setStatusActionSuccess(null);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #dc2626",
                                    background: "#fef2f2",
                                    color: "#b91c1c",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "16px" }}
                                  >
                                    block
                                  </span>
                                  Block Account
                                </button>
                              </>
                            )}

                            {/* If Blocked: Can Unblock to Active or Move to Suspended */}
                            {selectedPassenger.isBlocked && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmingAction("unblock");
                                    setStatusActionError(null);
                                    setStatusActionSuccess(null);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    borderRadius: "8px",
                                    border:
                                      "1px solid var(--color-primary, #085300)",
                                    background:
                                      "var(--color-surface-container, #e8f5e9)",
                                    color: "var(--color-primary, #085300)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "16px" }}
                                  >
                                    lock_open
                                  </span>
                                  Unblock to Active
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmingAction("suspend");
                                    setStatusActionError(null);
                                    setStatusActionSuccess(null);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #f59e0b",
                                    background: "#fffbeb",
                                    color: "#b45309",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "16px" }}
                                  >
                                    pause_circle
                                  </span>
                                  Move to Suspended
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Confirmation Box */}
                        {confirmingAction && (
                          <div
                            style={{
                              padding: "14px 16px",
                              borderRadius: "10px",
                              border:
                                confirmingAction === "block"
                                  ? "2px solid #fca5a5"
                                  : confirmingAction === "suspend"
                                  ? "2px solid #fde68a"
                                  : "2px solid #86efac",
                              background:
                                confirmingAction === "block"
                                  ? "#fff5f5"
                                  : confirmingAction === "suspend"
                                  ? "#fffdf5"
                                  : "#f6fff8",
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: "20px",
                                  color:
                                    confirmingAction === "block"
                                      ? "#dc2626"
                                      : confirmingAction === "suspend"
                                      ? "#d97706"
                                      : "var(--color-primary, #085300)",
                                }}
                              >
                                {confirmingAction === "block"
                                  ? "warning"
                                  : confirmingAction === "suspend"
                                  ? "help"
                                  : "verified"}
                              </span>
                              <strong
                                style={{
                                  fontSize: "13px",
                                  color: "var(--color-text-primary)",
                                }}
                              >
                                Confirm Action:{" "}
                                {confirmingAction === "block"
                                  ? "Block Account"
                                  : confirmingAction === "suspend"
                                  ? "Suspend Account"
                                  : confirmingAction === "restore"
                                  ? "Restore to Active"
                                  : "Unblock Account"}
                              </strong>
                            </div>

                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                color: "var(--color-text-secondary)",
                                lineHeight: 1.5,
                              }}
                            >
                              {confirmingAction === "block"
                                ? "Blocking will immediately deny this user at OTP login and reject all authenticated API calls with 403 Forbidden."
                                : confirmingAction === "suspend"
                                ? "Suspending will temporarily lock out the user from booking rides while keeping account records on hold."
                                : "Restoring or unblocking this account will reactivate full platform access and allow OTP verification."}
                            </p>

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <label
                                htmlFor="action-reason-input"
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                Administrative Reason / Audit Note (Optional)
                              </label>
                              <input
                                id="action-reason-input"
                                type="text"
                                placeholder="e.g., Rider requested hold, suspected identity abuse, fraud dispute…"
                                value={actionReason}
                                onChange={(e) =>
                                  setActionReason(e.target.value)
                                }
                                disabled={statusActionInProgress}
                                style={{
                                  width: "100%",
                                  height: "36px",
                                  padding: "0 10px",
                                  borderRadius: "6px",
                                  border:
                                    "1px solid var(--color-border, #d1d5db)",
                                  background: "#ffffff",
                                  fontSize: "12px",
                                  fontFamily: "inherit",
                                  outline: "none",
                                }}
                              />
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                justifyContent: "flex-end",
                                marginTop: "4px",
                              }}
                            >
                              <button
                                type="button"
                                disabled={statusActionInProgress}
                                onClick={() => {
                                  setConfirmingAction(null);
                                  setActionReason("");
                                  setStatusActionError(null);
                                }}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "6px",
                                  border:
                                    "1px solid var(--color-border, #d1d5db)",
                                  background: "#ffffff",
                                  color: "var(--color-text-secondary)",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  fontFamily: "inherit",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={statusActionInProgress}
                                onClick={handleApplyStatusAction}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background:
                                    confirmingAction === "block"
                                      ? "#dc2626"
                                      : confirmingAction === "suspend"
                                      ? "#d97706"
                                      : "var(--color-primary, #085300)",
                                  color: "#ffffff",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: statusActionInProgress
                                    ? "wait"
                                    : "pointer",
                                  fontFamily: "inherit",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                {statusActionInProgress && (
                                  <span
                                    className="material-symbols-outlined"
                                    style={{
                                      fontSize: "14px",
                                      animation:
                                        "pickme-spin 0.8s linear infinite",
                                    }}
                                  >
                                    progress_activity
                                  </span>
                                )}
                                Confirm &amp; Apply
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Drawer Footer */}
            <div className="drawer-footer">
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                PickMe Operations Telemetry • IN-SOUTH-1
              </span>
              <button
                type="button"
                className="page-btn"
                onClick={handleCloseDetail}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
