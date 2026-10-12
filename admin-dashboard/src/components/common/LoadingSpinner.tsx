import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  message,
  fullPage = false,
}) => {
  const sizeMap = {
    sm: "18px",
    md: "28px",
    lg: "44px",
  };

  const spinnerContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          borderRadius: "50%",
          border: "3px solid var(--color-surface-dim)",
          borderTopColor: "var(--color-primary)",
          animation: "pickme-spin 0.8s linear infinite",
        }}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <span
          style={{
            fontSize: "13px",
            color: "var(--color-text-secondary)",
            fontWeight: 500,
          }}
        >
          {message}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-bg)",
        }}
      >
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};
