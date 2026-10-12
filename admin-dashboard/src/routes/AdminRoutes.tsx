import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminLayout } from "../components/layout/AdminLayout";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DriversPage } from "../pages/DriversPage";
import { DriverVerificationPage } from "../pages/DriverVerificationPage";
import { PassengersPage } from "../pages/PassengersPage";
import { RidesPage } from "../pages/RidesPage";
import { ScheduledRidesPage } from "../pages/ScheduledRidesPage";
import { PermissionDeniedPage } from "../pages/PermissionDeniedPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { EmptyState } from "../components/common/EmptyState";

// Placeholder module for un-implemented screens
const ModulePlaceholder: React.FC<{ name: string; phase?: string }> = ({
  name,
  phase = "Phase B",
}) => (
  <div style={{ padding: "8px 0" }}>
    <EmptyState
      icon="construction"
      title={`${name} Console Module`}
      description={`This operational screen is scheduled for implementation in ${phase}. The underlying API routes and UI views have not been activated in Phase A.`}
    />
  </div>
);

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route: Admin Login */}
      <Route path="/login" element={<AdminLoginPage />} />

      {/* Permission Denied Route: Always accessible */}
      <Route path="/permission-denied" element={<AdminLayout />}>
        <Route index element={<PermissionDeniedPage />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Phase B: Drivers & Verification */}
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/drivers/:id/verify" element={<DriverVerificationPage />} />
          <Route path="/users" element={<PassengersPage />} />
          <Route path="/passengers" element={<Navigate to="/users" replace />} />
          <Route path="/rides" element={<RidesPage />} />
          <Route path="/scheduled" element={<ScheduledRidesPage />} />
          <Route path="/scheduled-rides" element={<Navigate to="/scheduled" replace />} />
          <Route
            path="/fares"
            element={<ModulePlaceholder name="Fare Matrix & Surge Pricing" phase="Phase D" />}
          />
          <Route
            path="/analytics"
            element={<ModulePlaceholder name="Occupancy & Network Analytics" phase="Phase D" />}
          />
          <Route
            path="/complaints"
            element={<ModulePlaceholder name="Complaints & Support Tickets" phase="Phase E" />}
          />
          <Route
            path="/reports"
            element={<ModulePlaceholder name="Operational Reports" phase="Phase E" />}
          />
          <Route
            path="/notifications"
            element={<ModulePlaceholder name="Broadcast & Alerts" phase="Phase E" />}
          />
          <Route
            path="/platform-settings"
            element={<ModulePlaceholder name="Platform Settings" phase="Phase F" />}
          />
          <Route
            path="/audit-logs"
            element={<ModulePlaceholder name="Audit Logs & Compliance" phase="Phase F" />}
          />
          <Route
            path="/admin-profile"
            element={<ModulePlaceholder name="Admin Profile & Access" phase="Phase F" />}
          />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
};
