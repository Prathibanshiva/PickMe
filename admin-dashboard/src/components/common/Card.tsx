import React, { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  padding = "md",
  children,
  className = "",
  style,
  ...props
}) => {
  const paddingMap = {
    none: "0",
    sm: "12px",
    md: "20px",
    lg: "28px",
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        ...style,
      }}
      className={`pickme-card ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  margin: "2px 0 0 0",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div style={{ padding: paddingMap[padding] }}>{children}</div>
    </div>
  );
};
