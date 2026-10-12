import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { ApiError } from "../types/auth";

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();

  // Email starts empty by default
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setErrorCode(undefined);

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      setLocalError("Please enter your administrator email address.");
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setLocalError("Please enter a valid administrator email address.");
      return;
    }

    if (!password) {
      setLocalError("Please enter your administrator password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cleanEmail, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorCode(apiErr.code);

      if (apiErr.status === 403) {
        navigate("/permission-denied", {
          state: {
            reason: apiErr.message,
            code: apiErr.code || "GATE-AUTH-403",
            phone: cleanEmail,
          },
          replace: true,
        });
      } else {
        setLocalError(
          apiErr.message || "Authentication failed. Please verify your email and password."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="pickme-login-container">
      {/* Background Graphic Grid */}
      <div className="pickme-login-bg-grid" />

      <div className="pickme-login-card">
        {/* Brand Header */}
        <div className="pickme-login-header">
          <div className="pickme-brand" style={{ justifyContent: "center" }}>
            <span className="pickme-brand-text">
              Pick<span className="pickme-brand-accent">Me</span>
            </span>
            <span className="pickme-admin-badge">Admin</span>
          </div>

          <h1 className="pickme-login-title">Operations Command</h1>
          <p className="pickme-login-subtitle">
            Restricted access portal for PickMe fleet operations, telemetry, and administrative dispatch.
          </p>
        </div>

        {/* Security Notification Banner */}
        <div className="pickme-security-banner">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px", color: "var(--color-primary)" }}
          >
            lock
          </span>
          <div>
            <strong>Level 4 Security Gateway</strong>
            <p>
              Direct credential verification with cryptographic JWT session management. Exclusively authorized for designated administrative personnel.
            </p>
          </div>
        </div>

        {/* Active Error Banner */}
        {activeError && (
          <div style={{ marginBottom: "16px" }}>
            <ErrorMessage
              title="Authentication Alert"
              message={activeError}
              code={errorCode || "GATE-AUTH-403"}
              onDismiss={() => {
                clearError();
                setLocalError(null);
                setErrorCode(undefined);
              }}
            />
          </div>
        )}

        {/* Email + Password Form */}
        <form onSubmit={handleLoginSubmit} className="pickme-login-form">
          <Input
            label="Administrator Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            disabled={isSubmitting}
            leftIcon={
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px" }}
              >
                mail
              </span>
            }
            helperText="Enter your registered administrator email address."
            required
            autoFocus
          />

          <Input
            label="Administrator Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            disabled={isSubmitting}
            leftIcon={
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px" }}
              >
                key
              </span>
            }
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px" }}
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            }
            helperText="Enter your private administrator password."
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            rightIcon={
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px" }}
              >
                arrow_forward
              </span>
            }
          >
            Authorize Console Access
          </Button>
        </form>

        {/* Security Footer Notice */}
        <div className="pickme-login-footer">
          <div className="pickme-compliance-text">
            <span>TLS 1.3 Encrypted Session</span>
            <span>•</span>
            <span>Audit Ref: SEC-PORTAL-IN</span>
          </div>
          <p className="pickme-admin-note">
            Notice: If your account has not been granted administrator clearance by the system owner, access will be blocked by the server policy gate.
          </p>
        </div>
      </div>
    </div>
  );
};
