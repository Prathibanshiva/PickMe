import React from "react";

export type BadgeVariant =
  | "live"
  | "pending"
  | "critical"
  | "info"
  | "neutral"
  | "primary";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  pulse = false,
}) => {
  const getStyles = (): {
    bg: string;
    text: string;
    dotColor?: string;
  } => {
    switch (variant) {
      case "live":
        return {
          bg: "var(--color-secondary-container)",
          text: "var(--color-on-secondary-container)",
          dotColor: "var(--color-action)",
        };
      case "pending":
        return {
          bg: "var(--color-warning-container)",
          text: "var(--color-on-warning)",
          dotColor: "var(--color-warning)",
        };
      case "critical":
        return {
          bg: "var(--color-error-container)",
          text: "var(--color-on-error-container)",
          dotColor: "var(--color-error)",
        };
      case "info":
        return {
          bg: "var(--color-info-container)",
          text: "var(--color-on-info)",
          dotColor: "var(--color-info)",
        };
      case "primary":
        return {
          bg: "var(--color-primary)",
          text: "var(--color-on-primary)",
        };
      case "neutral":
      default:
        return {
          bg: "var(--color-surface-low)",
          text: "var(--color-text-secondary)",
          dotColor: "var(--color-text-muted)",
        };
    }
  };

  const { bg, text, dotColor } = getStyles();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "2px 8px",
        height: "22px",
        borderRadius: "var(--radius-pill)",
        backgroundColor: bg,
        color: text,
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {dotColor && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: dotColor,
            animation: pulse ? "pickme-pulse 1.8s infinite" : "none",
            display: "inline-block",
          }}
        />
      )}
      {children}
    </span>
  );
};
