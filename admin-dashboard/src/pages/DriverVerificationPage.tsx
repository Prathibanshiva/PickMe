import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDriverById, approveDriver, rejectDriver } from "../api/drivers";
import type { DriverDetail, RejectionCode } from "../types/drivers";
import type { ApiError } from "../types/auth";

// ─── constants ───────────────────────────────────────────────────────────────

const REJECTION_CODES: { code: RejectionCode; label: string; hint: string }[] = [
  {
    code: "dl_unreadable",
    label: "DL Unreadable",
    hint: "Driving licence image is blurry or cropped",
  },
  {
    code: "aadhaar_mismatch",
    label: "Aadhaar Mismatch",
    hint: "Name or DOB does not match across documents",
  },
  {
    code: "plate_obscured",
    label: "Plate Obscured",
    hint: "Vehicle registration plate is not legible",
  },
  {
    code: "expired_docs",
    label: "Expired Documents",
    hint: "One or more documents are past their validity date",
  },
  {
    code: "liveness_fail",
    label: "Liveness Fail",
    hint: "Profile photo did not pass biometric liveness check",
  },
  {
    code: "other",
    label: "Other",
    hint: "Please describe the issue in the rejection reason field",
  },
];

type DocumentKey = "profilePhoto" | "aadhaarDocument" | "drivingLicenceDocument" | "vehiclePhoto";

interface DocSlot {
  key: DocumentKey;
  label: string;
  icon: string;
  hint: string;
}

const DOC_SLOTS: DocSlot[] = [
  { key: "profilePhoto", label: "Profile Photo", icon: "face", hint: "Biometric portrait" },
  {
    key: "drivingLicenceDocument",
    label: "Driving Licence",
    icon: "credit_card",
    hint: "DL front side",
  },
  {
    key: "aadhaarDocument",
    label: "Aadhaar Card",
    icon: "contact_page",
    hint: "National identity",
  },
  {
    key: "vehiclePhoto",
    label: "Vehicle & Plate",
    icon: "electric_rickshaw",
    hint: "Registration plate visible",
  },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true only if the path looks like a reachable HTTP(S) URL.
 * Rejects file:/// URIs, empty strings, and any other non-HTTP path.
 */
function isWebReachable(path: string): boolean {
  if (!path) return false;
  return path.startsWith("http://") || path.startsWith("https://");
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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

function initials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "DR";
}

// ─── component ───────────────────────────────────────────────────────────────

type ModalState = "idle" | "reject";
type ActionState = "idle" | "loading" | "done" | "error";

export const DriverVerificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Document viewer state
  const [activeDoc, setActiveDoc] = useState<DocumentKey>("profilePhoto");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Adjudication state
  const [modal, setModal] = useState<ModalState>("idle");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCode, setRejectCode] = useState<RejectionCode>("other");
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const reasonRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Load driver ──────────────────────────────────────────────────────────
  const loadDriver = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getDriverById(id);
      setDriver(res.driver);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setLoadError(
        apiErr.message || "Failed to load driver profile. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDriver();
  }, [loadDriver]);

  // Focus textarea when reject modal opens
  useEffect(() => {
    if (modal === "reject") {
      setTimeout(() => reasonRef.current?.focus(), 80);
    }
  }, [modal]);

  // ── Approve ──────────────────────────────────────────────────────────────
  async function handleApprove() {
    if (!driver || actionState === "loading") return;
    setActionState("loading");
    setActionMessage(null);
    try {
      const res = await approveDriver(String(driver.id));
      setDriver((d) =>
        d
          ? { ...d, verificationStatus: "approved", verifiedAt: res.driver.verifiedAt || null }
          : d
      );
      setActionState("done");
      setActionMessage("Driver verification approved successfully.");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setActionState("error");
      setActionMessage(apiErr.message || "Approval failed. Please try again.");
    }
  }

  // ── Reject ───────────────────────────────────────────────────────────────
  async function handleReject() {
    if (!driver || !rejectReason.trim() || actionState === "loading") return;
    setActionState("loading");
    setActionMessage(null);
    try {
      const res = await rejectDriver(String(driver.id), rejectReason.trim(), rejectCode);
      setDriver((d) =>
        d
          ? {
              ...d,
              verificationStatus: "rejected",
              rejectionReason: res.driver.rejectionReason || rejectReason.trim(),
              rejectionCode: res.driver.rejectionCode || rejectCode,
            }
          : d
      );
      setModal("idle");
      setActionState("done");
      setActionMessage("Driver verification rejected. The driver has been notified.");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setActionState("error");
      setActionMessage(apiErr.message || "Rejection failed. Please try again.");
    }
  }

  // ── Zoom / Rotate ─────────────────────────────────────────────────────────
  const zoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const zoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const rotate = () => setRotation((r) => (r + 90) % 360);
  const resetView = () => { setZoom(100); setRotation(0); };

  const activeDocPath = driver ? driver[activeDoc] : "";
  const docReachable = isWebReachable(activeDocPath);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-loading-center">
        <span className="table-spinner large-spinner" aria-label="Loading driver profile…" />
        <p className="loading-text">Loading driver profile…</p>
      </div>
    );
  }

  if (loadError || !driver) {
    return (
      <div className="page-error-center">
        <span className="material-symbols-outlined error-icon-lg">error</span>
        <p className="error-title">Could not load driver profile</p>
        <p className="error-sub">{loadError}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button type="button" className="btn-action-ghost" onClick={() => navigate("/drivers")}>
            ← Back to Drivers
          </button>
          <button type="button" className="btn-action-primary" onClick={loadDriver}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isPending = driver.verificationStatus === "pending";
  const isApproved = driver.verificationStatus === "approved";
  const isRejected = driver.verificationStatus === "rejected";

  return (
    <div className="verify-page">
      {/* ── Breadcrumb ── */}
      <div className="verify-breadcrumb">
        <button
          type="button"
          className="breadcrumb-back"
          onClick={() => navigate("/drivers")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_back
          </span>
          Back to Drivers
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">KYC Dossier Review</span>
      </div>

      {/* ── Identity summary bar ── */}
      <div className="verify-identity-bar">
        <div className="identity-left">
          <div className="verify-avatar-wrap">
            <div className="verify-avatar">{initials(driver.driverName || "DR")}</div>
            {isApproved && (
              <span className="verify-avatar-badge" title="Verified">
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                  verified
                </span>
              </span>
            )}
          </div>
          <div>
            <div className="identity-name-row">
              <h1 className="identity-name">{driver.driverName || "Unnamed Driver"}</h1>
              <span className="driver-id-badge">ID: {String(driver.id).slice(-6).toUpperCase()}</span>
              {isPending && (
                <span className="admin-badge admin-badge-warning pulsing">
                  <span className="admin-badge-dot pulsing-dot" />
                  Pending Review
                </span>
              )}
              {isApproved && (
                <span className="admin-badge admin-badge-success">
                  <span className="admin-badge-dot" />
                  Approved
                </span>
              )}
              {isRejected && (
                <span className="admin-badge admin-badge-error">
                  <span className="admin-badge-dot" />
                  Rejected
                </span>
              )}
            </div>
            <div className="identity-meta-row">
              {driver.phoneNumber && (
                <span className="identity-meta-item">
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    call
                  </span>
                  {driver.phoneNumber}
                </span>
              )}
              {driver.vehicleType && (
                <span className="identity-meta-item">
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    {vehicleIcon(driver.vehicleType)}
                  </span>
                  {driver.vehicleType.charAt(0).toUpperCase() + driver.vehicleType.slice(1)}
                  {driver.vehicleNumber ? ` (${driver.vehicleNumber})` : ""}
                </span>
              )}
              {driver.createdAt && (
                <span className="identity-meta-item">
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    schedule
                  </span>
                  Submitted {timeAgo(driver.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action feedback banner ── */}
      {actionMessage && (
        <div
          className={`action-banner ${actionState === "done" ? "action-banner-success" : "action-banner-error"}`}
          role="status"
        >
          <span className="material-symbols-outlined">
            {actionState === "done" ? "check_circle" : "error"}
          </span>
          <span>{actionMessage}</span>
          <button
            type="button"
            className="banner-dismiss"
            onClick={() => {
              setActionMessage(null);
              setActionState("idle");
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              close
            </span>
          </button>
        </div>
      )}

      {/* ── Main 2-column workspace ── */}
      <div className="verify-workspace">
        {/* LEFT: Document Roster + Inspector */}
        <div className="verify-left">
          <div className="doc-roster-header">
            <h2 className="section-title">Submitted Documents</h2>
            <span className="doc-count-badge">{DOC_SLOTS.length} items</span>
            <span className="doc-roster-hint">
              Click any document to inspect
            </span>
          </div>

          {/* Document cards grid */}
          <div className="doc-cards-grid">
            {DOC_SLOTS.map(({ key, label, icon, hint }) => {
              const path = driver[key];
              const reachable = isWebReachable(path);
              const isActive = activeDoc === key;

              return (
                <button
                  key={key}
                  type="button"
                  className={`doc-card${isActive ? " doc-card-active" : ""}`}
                  onClick={() => { setActiveDoc(key); resetView(); }}
                >
                  <div className="doc-card-thumb">
                    {reachable ? (
                      <img
                        src={path}
                        alt={label}
                        className="doc-thumb-img"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector(".doc-thumb-fallback");
                            if (fallback) (fallback as HTMLElement).style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="doc-thumb-fallback"
                      style={{ display: reachable ? "none" : "flex" }}
                    >
                      <span className="material-symbols-outlined doc-thumb-icon">
                        {icon}
                      </span>
                    </div>
                  </div>
                  <div className="doc-card-info">
                    <p className="doc-card-label">{label}</p>
                    <p className="doc-card-hint">{reachable ? hint : "Not yet uploaded"}</p>
                  </div>
                  {isActive && (
                    <span className="doc-active-indicator">Active</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Document Inspector Canvas */}
          <div className="doc-inspector-card">
            <div className="inspector-toolbar">
              <div>
                <span className="inspector-doc-name">
                  {DOC_SLOTS.find((s) => s.key === activeDoc)?.label ?? "Document"}
                </span>
              </div>
              <div className="inspector-controls">
                <button
                  type="button"
                  className="inspector-btn"
                  title="Zoom Out"
                  onClick={zoomOut}
                  disabled={zoom <= 50}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    zoom_out
                  </span>
                </button>
                <span className="zoom-level">{zoom}%</span>
                <button
                  type="button"
                  className="inspector-btn"
                  title="Zoom In"
                  onClick={zoomIn}
                  disabled={zoom >= 200}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    zoom_in
                  </span>
                </button>
                <div className="inspector-divider" />
                <button
                  type="button"
                  className="inspector-btn"
                  title="Rotate 90°"
                  onClick={rotate}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    rotate_right
                  </span>
                </button>
                <button
                  type="button"
                  className="inspector-btn"
                  title="Reset View"
                  onClick={resetView}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    fit_screen
                  </span>
                </button>
              </div>
            </div>

            {/* Canvas stage */}
            <div className="inspector-canvas">
              <div className="inspector-grid-bg" />
              {docReachable ? (
                <img
                  src={activeDocPath}
                  alt={DOC_SLOTS.find((s) => s.key === activeDoc)?.label}
                  className="inspector-img"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="inspector-unavailable">
                  <span className="material-symbols-outlined inspector-unavail-icon">
                    hide_image
                  </span>
                  <p className="inspector-unavail-title">Document not available</p>
                  <p className="inspector-unavail-sub">
                    The driver submitted a local file path that cannot be rendered
                    in the web admin. The driver must re-upload this document via
                    the mobile app to enable review.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Adjudication Panel */}
        <div className="verify-right">
          <div className="adjudication-panel">
            <div className="adjudication-header">
              <span className="material-symbols-outlined adj-header-icon">
                gavel
              </span>
              <h3 className="adj-title">Adjudication</h3>
            </div>

            {/* Current status summary */}
            <div className="adj-status-block">
              <p className="adj-status-label">Current Status</p>
              <p className="adj-status-value">
                {isPending
                  ? "Awaiting review"
                  : isApproved
                  ? `Approved on ${formatDate(driver.verifiedAt)}`
                  : `Rejected on ${formatDate(driver.verifiedAt)}`}
              </p>
              {isRejected && driver.rejectionReason && (
                <div className="adj-rejection-reason">
                  <p className="adj-rejection-code-label">
                    Code:{" "}
                    <strong>
                      {driver.rejectionCode || "other"}
                    </strong>
                  </p>
                  <p className="adj-rejection-text">
                    &ldquo;{driver.rejectionReason}&rdquo;
                  </p>
                </div>
              )}
              {(isApproved || isRejected) && driver.verifiedBy && (
                <p className="adj-verified-by">
                  By{" "}
                  <strong>
                    {driver.verifiedBy.name || driver.verifiedBy.email}
                  </strong>
                </p>
              )}
            </div>

            {/* KYC Checklist */}
            <div className="adj-checklist">
              <p className="adj-section-label">KYC Checklist</p>
              {[
                { label: "Profile photo submitted", ok: Boolean(driver.profilePhoto) },
                { label: "Driving licence submitted", ok: Boolean(driver.drivingLicenceDocument) },
                { label: "Aadhaar card submitted", ok: Boolean(driver.aadhaarDocument) },
                { label: "Vehicle photo submitted", ok: Boolean(driver.vehiclePhoto) },
                { label: "Vehicle number recorded", ok: Boolean(driver.vehicleNumber) },
              ].map(({ label, ok }) => (
                <div key={label} className="checklist-item">
                  <span
                    className={`material-symbols-outlined checklist-icon ${ok ? "check-ok" : "check-miss"}`}
                  >
                    {ok ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  <span className={`checklist-label ${ok ? "" : "check-miss-text"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Driver details summary */}
            <div className="adj-detail-block">
              <p className="adj-section-label">Profile Details</p>
              <div className="detail-row">
                <span className="detail-key">Phone</span>
                <span className="detail-val">{driver.phoneNumber || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Email</span>
                <span className="detail-val">{driver.email || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Vehicle</span>
                <span className="detail-val">
                  {driver.vehicleType
                    ? `${driver.vehicleType.charAt(0).toUpperCase() + driver.vehicleType.slice(1)}${driver.vehicleNumber ? ` · ${driver.vehicleNumber}` : ""}`
                    : "—"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Submitted</span>
                <span className="detail-val">{formatDate(driver.createdAt)}</span>
              </div>
            </div>

            {/* Adjudication buttons — only for pending */}
            {isPending && (
              <div className="adj-actions">
                <button
                  type="button"
                  id="approve-driver-btn"
                  className="adj-approve-btn"
                  disabled={actionState === "loading"}
                  onClick={handleApprove}
                >
                  {actionState === "loading" ? (
                    <span className="table-spinner small-spinner" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        check_circle
                      </span>
                      Approve Driver
                    </>
                  )}
                </button>
                <button
                  type="button"
                  id="reject-driver-btn"
                  className="adj-reject-btn"
                  disabled={actionState === "loading"}
                  onClick={() => setModal("reject")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    cancel
                  </span>
                  Reject with Reason
                </button>
              </div>
            )}

            {!isPending && (
              <div className="adj-finalized-note">
                <span className="material-symbols-outlined" style={{ fontSize: 16, opacity: 0.6 }}>
                  lock
                </span>
                <span>
                  This application has been {driver.verificationStatus}. No further
                  adjudication is required until the driver resubmits.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Reject Modal ── */}
      {modal === "reject" && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
          <div className="modal-card">
            <div className="modal-header">
              <h2 id="reject-modal-title" className="modal-title">
                Reject Application
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModal("idle")}
                aria-label="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>

            <p className="modal-driver-name">
              Driver:{" "}
              <strong>{driver.driverName || "Unnamed Driver"}</strong>
            </p>

            {/* Rejection code selector */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="rejection-code-select">
                Rejection Code
              </label>
              <div className="rejection-code-grid">
                {REJECTION_CODES.map(({ code, label, hint }) => (
                  <button
                    key={code}
                    type="button"
                    className={`rejection-code-chip${rejectCode === code ? " chip-active" : ""}`}
                    onClick={() => setRejectCode(code)}
                    title={hint}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="modal-field-hint">
                {REJECTION_CODES.find((r) => r.code === rejectCode)?.hint}
              </p>
            </div>

            {/* Rejection reason textarea */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="rejection-reason-textarea">
                Rejection Reason <span className="required-star">*</span>
              </label>
              <textarea
                id="rejection-reason-textarea"
                ref={reasonRef}
                className="modal-textarea"
                placeholder="Describe the specific issue clearly so the driver can take corrective action…"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                maxLength={500}
              />
              <p className="modal-char-count">{rejectReason.length}/500</p>
            </div>

            {actionState === "error" && actionMessage && (
              <div className="modal-error-banner" role="alert">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  error
                </span>
                {actionMessage}
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="btn-action-ghost"
                onClick={() => setModal("idle")}
                disabled={actionState === "loading"}
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-reject-btn"
                className="adj-reject-btn"
                disabled={!rejectReason.trim() || actionState === "loading"}
                onClick={handleReject}
              >
                {actionState === "loading" ? (
                  <span className="table-spinner small-spinner" />
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      cancel
                    </span>
                    Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
