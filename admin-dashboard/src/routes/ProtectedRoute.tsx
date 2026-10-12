import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, hasAdminRole, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <LoadingSpinner
        fullPage
        size="lg"
        message="Verifying security clearance and active console session..."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAdminRole) {
    return (
      <Navigate
        to="/permission-denied"
        state={{
          reason: "Access restricted. Active identity does not possess required 'admin' role clearance.",
          code: "GATE-AUTH-403",
        }}
        replace
      />
    );
  }

  return <Outlet />;
};
