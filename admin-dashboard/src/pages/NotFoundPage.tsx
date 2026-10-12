import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: "32px",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: "56px", color: "var(--color-text-muted)", marginBottom: "16px" }}
      >
        search_off
      </span>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          margin: "0 0 8px 0",
        }}
      >
        Page Not Found
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "var(--color-text-muted)",
          maxWidth: "400px",
          margin: "0 0 24px 0",
        }}
      >
        The requested administrative console route does not exist or has been relocated.
      </p>
      <Button variant="primary" onClick={() => navigate("/")}>
        Back to Dashboard
      </Button>
    </div>
  );
};
