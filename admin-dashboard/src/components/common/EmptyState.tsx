import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "inbox",
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        backgroundColor: "var(--color-surface-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px dashed var(--color-border)",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "var(--color-surface-low)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "28px",
            color: "var(--color-text-muted)",
          }}
        >
          {icon}
        </span>
      </div>

      <h3
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          margin: "0 0 6px 0",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "13px",
          color: "var(--color-text-muted)",
          maxWidth: "380px",
          margin: "0 0 20px 0",
          lineHeight: "1.5",
        }}
      >
        {description}
      </p>

      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
