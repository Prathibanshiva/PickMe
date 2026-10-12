import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";

interface LocationState {
  reason?: string;
  code?: string;
  phone?: string;
}

export const PermissionDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, isAuthenticated, logout } = useAuth();
  const state = (location.state as LocationState) || {};

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isAuthenticated ? "/" : "/login");
    }
  };

  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      navigate("/");
    } else {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="pickme-permission-denied-page">
      {/* Header Bar */}
      <div className="pickme-page-header">
        <div className="pickme-page-header-text">
          <h1 className="pickme-page-title">Permission Denied</h1>
          <p className="pickme-page-subtitle">
            Security clearance verification and policy gate.
          </p>
        </div>

        <div className="pickme-gate-badge">
          <span className="pickme-gate-dot" />
          <span className="pickme-gate-code">
            {state.code || "GATE-AUTH-403"}
          </span>
        </div>
      </div>

      {/* Center Tactical Card */}
      <div className="pickme-center-wrapper">
        <div className="pickme-denied-card">
          {/* Shield Icon with Red Indicator */}
          <div className="pickme-shield-container">
            <span
              className="material-symbols-outlined pickme-shield-icon"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield_lock
            </span>
            <span className="pickme-shield-badge">
              <span className="pickme-shield-badge-dot" />
            </span>
          </div>

          {/* Level Tag */}
          <div className="pickme-level-pill">Level 4 Protected Resource</div>

          {/* Headline */}
          <h2 className="pickme-denied-headline">
            You don't have permission to access this page.
          </h2>

          {/* Description */}
          <p className="pickme-denied-description">
            {state.reason || (
              <>
                Your account (
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {admin?.email || admin?.phoneNumber || state.phone || "unauthorized user"}
                </strong>
                ) does not have the required administrator privileges to access this console. If you believe this is an error, please contact your Organization Security Administrator.
              </>
            )}
          </p>

          {/* Security Scope Strip */}
          <div className="pickme-scope-strip">
            <div className="pickme-scope-item">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px", color: "var(--color-text-muted)" }}
              >
                info
              </span>
              <span>
                Required Scope:{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  ROLE_ADMIN_OPERATIONS
                </strong>
              </span>
            </div>
            <div className="pickme-scope-ref">
              REF-403-UNAUTHORIZED • Cluster IN-SOUTH-1
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pickme-action-group">
            <Button
              variant="secondary"
              size="md"
              onClick={handleGoBack}
              leftIcon={
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px" }}
                >
                  arrow_back
                </span>
              }
            >
              Go Back
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handlePrimaryAction}
              leftIcon={
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px" }}
                >
                  {isAuthenticated ? "dashboard" : "login"}
                </span>
              }
            >
              {isAuthenticated ? "Back to Dashboard" : "Return to Login"}
            </Button>
          </div>

          {/* Footer Metadata */}
          <div className="pickme-denied-footer">
            <div className="pickme-denied-links">
              <button
                type="button"
                className="pickme-link-button"
                onClick={() => alert("Access request logged to system audit queue.")}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  contact_support
                </span>
                <span>Request Elevated Access</span>
              </button>
              <span style={{ color: "var(--color-border)" }}>•</span>
              <button
                type="button"
                className="pickme-link-button"
                onClick={() => alert("RBAC Policy requires server-verified defaultRole: 'admin'.")}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  policy
                </span>
                <span>RBAC Policy Guidelines</span>
              </button>
            </div>

            <div className="pickme-audit-text">
              Audit telemetry recorded • Incident ref #SEC-89210-BLR
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
