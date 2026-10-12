import React, { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightElement,
  disabled,
  id,
  className = "",
  style,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: error ? "var(--color-error)" : "var(--color-text-primary)",
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        {leftIcon && (
          <span
            style={{
              position: "absolute",
              left: "12px",
              display: "flex",
              alignItems: "center",
              color: "var(--color-text-muted)",
              pointerEvents: "none",
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          disabled={disabled}
          style={{
            width: "100%",
            height: "40px",
            paddingLeft: leftIcon ? "38px" : "12px",
            paddingRight: rightElement ? "40px" : "12px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${error ? "var(--color-error)" : "var(--color-border)"}`,
            backgroundColor: disabled ? "var(--color-surface-low)" : "var(--color-surface-card)",
            color: "var(--color-text-primary)",
            fontSize: "14px",
            outline: "none",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            ...style,
          }}
          className={`pickme-input ${error ? "pickme-input-error" : ""} ${className}`}
          {...props}
        />

        {rightElement && (
          <span
            style={{
              position: "absolute",
              right: "10px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {rightElement}
          </span>
        )}
      </div>

      {error ? (
        <span
          style={{
            fontSize: "12px",
            color: "var(--color-error)",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "14px" }}
          >
            error
          </span>
          {error}
        </span>
      ) : helperText ? (
        <span
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted)",
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
