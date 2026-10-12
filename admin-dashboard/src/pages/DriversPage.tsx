import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getDrivers } from "../api/drivers";
import type { DriverListItem, VerificationStatus } from "../types/drivers";
import type { ApiError } from "../types/auth";

// ─── helpers ─────────────────────────────────────────────────────────────────

type TabFilter = "all" | "pending" | "approved" | "rejected";

const TAB_LABELS: { key: TabFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function verificationBadge(status: VerificationStatus) {
  switch (status) {
    case "pending":
      return (
        <span className="admin-badge admin-badge-warning">
          <span className="admin-badge-dot" />
          Pending Review
        </span>
      );
    case "approved":
      return (
        <span className="admin-badge admin-badge-success">
          <span className="admin-badge-dot" />
          Approved
        </span>
      );
    case "rejected":
      return (
        <span className="admin-badge admin-badge-error">
          <span className="admin-badge-dot" />
          Rejected
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

function accountBadge(driver: DriverListItem) {
  if (driver.isBlocked)
    return (
      <span className="admin-badge admin-badge-error">Blocked</span>
    );
  if (driver.isSuspended)
    return (
      <span className="admin-badge admin-badge-warning">Suspended</span>
    );
  if (driver.verificationStatus === "approved")
    return (
      <span className="admin-badge admin-badge-success">Active</span>
    );
  return (
    <span className="admin-badge admin-badge-neutral">Under Review</span>
  );
}

/** Derive an initials avatar from a driver name */
function initials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "DR";
}

function vehicleIcon(vehicleType: string | null) {
  switch ((vehicleType || "").toLowerCase()) {
    case "auto":
      return "electric_rickshaw";
    case "car":
      return "directions_car";
    case "bike":
      return "two_wheeler";
    default:
      return "commute";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── component ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export const DriversPage: React.FC = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [tab]);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDrivers({
        status: tab === "all" ? undefined : tab,
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setDrivers(res.drivers);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(
        apiErr.message || "Failed to load drivers. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearch, page]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);


  return (
    <div className="drivers-page">
      {/* ── Ambient glow ── */}
      <div className="page-glow-top-right" />
      <div className="page-glow-mid-left" />

      {/* ── Page header ── */}
      <div className="page-header-row">
        <div>
          <div className="page-eyebrow">
            <span className="material-symbols-outlined eyebrow-icon">badge</span>
            <span>Fleet Network</span>
          </div>
          <h1 className="page-title">Drivers</h1>
          <p className="page-subtitle">
            Manage registered fleet partners and verification status.
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
                <span
                  className={`tab-count${key === "pending" ? " tab-count-warn" : ""}`}
                >
                  {total.toLocaleString("en-IN")}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="drivers-search-row">
        <div className="search-input-wrap">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            id="driver-search-input"
            type="text"
            className="search-input"
            placeholder="Search by driver name, phone, or vehicle plate…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                close
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="error-banner" role="alert">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
          <button
            type="button"
            className="error-retry-btn"
            onClick={fetchDrivers}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table card ── */}
      <div className="drivers-table-card">
        {loading && (
          <div className="table-loading-overlay">
            <span className="table-spinner" aria-label="Loading drivers…" />
          </div>
        )}

        <div className="table-scroll-wrapper">
          <table className="drivers-table">
            <thead>
              <tr>
                <th scope="col">Driver</th>
                <th scope="col">Vehicle</th>
                <th scope="col">Verification</th>
                <th scope="col">Account</th>
                <th scope="col">Joined</th>
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading && drivers.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-empty-cell">
                    <div className="table-empty-state">
                      <span className="material-symbols-outlined table-empty-icon">
                        badge
                      </span>
                      <p className="table-empty-title">No drivers found</p>
                      <p className="table-empty-sub">
                        {debouncedSearch
                          ? "Try a different search term."
                          : "No drivers match the selected filter."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {drivers.map((driver) => (
                <tr key={String(driver.id)} className="driver-row">
                  {/* Driver identity */}
                  <td>
                    <div className="driver-identity-cell">
                      <div className="driver-avatar">
                        {initials(driver.driverName || "DR")}
                        <span
                          className={`avatar-status-dot${
                            driver.verificationStatus === "approved" &&
                            !driver.isBlocked &&
                            !driver.isSuspended
                              ? " dot-online"
                              : ""
                          }`}
                        />
                      </div>
                      <div className="driver-identity-text">
                        <p className="driver-name">
                          {driver.driverName || <em>Unnamed</em>}
                        </p>
                        <p className="driver-phone">{driver.phoneNumber}</p>
                      </div>
                    </div>
                  </td>

                  {/* Vehicle */}
                  <td>
                    <div className="vehicle-cell">
                      <div className="vehicle-type-row">
                        <span className="material-symbols-outlined vehicle-icon">
                          {vehicleIcon(driver.vehicleType)}
                        </span>
                        <span className="vehicle-type-label">
                          {driver.vehicleType
                            ? driver.vehicleType.charAt(0).toUpperCase() +
                              driver.vehicleType.slice(1)
                            : "—"}
                        </span>
                      </div>
                      {driver.vehicleNumber && (
                        <span className="vehicle-plate">{driver.vehicleNumber}</span>
                      )}
                    </div>
                  </td>

                  {/* Verification status */}
                  <td>{verificationBadge(driver.verificationStatus)}</td>

                  {/* Account status */}
                  <td>{accountBadge(driver)}</td>

                  {/* Joined */}
                  <td className="joined-cell">
                    {driver.createdAt ? formatDate(driver.createdAt) : "—"}
                  </td>

                  {/* Actions */}
                  <td className="text-right">
                    <div className="driver-actions">
                      {driver.verificationStatus === "pending" ? (
                        <button
                          type="button"
                          className="btn-action-primary"
                          onClick={() =>
                            navigate(`/drivers/${String(driver.id)}/verify`)
                          }
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-action-ghost"
                          onClick={() =>
                            navigate(`/drivers/${String(driver.id)}/verify`)
                          }
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ── */}
        {!loading && total > 0 && (
          <div className="pagination-footer">
            <p className="pagination-info">
              Showing{" "}
              <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
              <strong>{Math.min(page * PAGE_SIZE, total)}</strong> of{" "}
              <strong>{total.toLocaleString("en-IN")}</strong> drivers
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
    </div>
  );
};
