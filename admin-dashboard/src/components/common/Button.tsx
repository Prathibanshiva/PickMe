import React, { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "kinetic" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className = "",
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "var(--color-primary)",
          color: "var(--color-on-primary)",
          border: "1px solid transparent",
        };
      case "kinetic":
        return {
          backgroundColor: "var(--color-action)",
          color: "var(--color-text-primary)",
          fontWeight: 700,
          border: "1px solid transparent",
        };
      case "destructive":
        return {
          backgroundColor: "var(--color-error)",
          color: "var(--color-on-error)",
          border: "1px solid transparent",
        };
      case "secondary":
        return {
          backgroundColor: "var(--color-surface-card)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          color: "var(--color-text-primary)",
          border: "1px solid transparent",
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case "sm":
        return {
          height: "32px",
          padding: "0 12px",
          fontSize: "12px",
        };
      case "lg":
        return {
          height: "44px",
          padding: "0 20px",
          fontSize: "15px",
        };
      case "md":
      default:
        return {
          height: "38px",
          padding: "0 16px",
          fontSize: "14px",
        };
    }
  };

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "var(--radius-md)",
    fontFamily: "inherit",
    fontWeight: 600,
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.15s ease-in-out",
    width: fullWidth ? "100%" : "auto",
    outline: "none",
    userSelect: "none",
    whiteSpace: "nowrap",
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  return (
    <button
      style={baseStyle}
      disabled={disabled || isLoading}
      className={`pickme-btn pickme-btn-${variant} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            animation: "pickme-spin 0.6s linear infinite",
            display: "inline-block",
          }}
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
