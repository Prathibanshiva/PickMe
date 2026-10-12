import React from "react";

export interface ErrorMessageProps {
  title?: string;
  message: string;
  code?: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  code,
  onDismiss,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-error-container)",
        color: "var(--color-on-error-container)",
        border: "1px solid rgba(186, 26, 26, 0.2)",
      }}
      role="alert"
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "20px",
          color: "var(--color-error)",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        warning
      </span>

      <div style={{ flex: 1 }}>
        {title && (
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "2px",
            }}
          >
            {title}
          </div>
        )}
        <div style={{ fontSize: "13px", lineHeight: "1.4" }}>{message}</div>
        {code && (
          <div
            style={{
              marginTop: "6px",
              fontSize: "11px",
              fontFamily: "monospace",
              opacity: 0.85,
            }}
          >
            Ref: {code}
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            color: "currentColor",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center",
            opacity: 0.7,
          }}
          aria-label="Dismiss error"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            close
          </span>
        </button>
      )}
    </div>
  );
};
