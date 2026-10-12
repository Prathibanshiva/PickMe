import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const OPERATIONS_NAV: NavItem[] = [
  { label: "Dashboard", path: "/", icon: "grid_view" },
  { label: "Drivers", path: "/drivers", icon: "badge" },
  { label: "Users", path: "/users", icon: "group" },
  { label: "Rides", path: "/rides", icon: "commute" },
  { label: "Scheduled", path: "/scheduled", icon: "schedule" },
  { label: "Fares", path: "/fares", icon: "payments" },
  { label: "Analytics", path: "/analytics", icon: "analytics" },
  { label: "Complaints", path: "/complaints", icon: "chat_bubble_outline" },
  { label: "Reports", path: "/reports", icon: "description" },
  { label: "Notifications", path: "/notifications", icon: "notifications" },
];

const CONFIG_NAV: NavItem[] = [
  { label: "Platform Settings", path: "/platform-settings", icon: "settings" },
  { label: "Audit Logs", path: "/audit-logs", icon: "history" },
  { label: "Admin Profile", path: "/admin-profile", icon: "manage_accounts" },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { admin, logout } = useAuth();

  return (
    <aside className="pickme-sidebar">
      {/* Brand Header */}
      <div className="pickme-sidebar-header">
        <div className="pickme-brand">
          <span className="pickme-brand-text">
            Pick<span className="pickme-brand-accent">Me</span>
          </span>
          <span className="pickme-admin-badge">Admin</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="pickme-sidebar-nav">
        {/* Operations */}
        <div className="pickme-nav-group">
          <div className="pickme-nav-group-title">Operations</div>
          <nav className="pickme-nav-list">
            {OPERATIONS_NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `pickme-nav-item ${isActive ? "active" : ""}`
                }
              >
                <span className="material-symbols-outlined pickme-nav-icon">
                  {item.icon}
                </span>
                <span className="pickme-nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Configuration */}
        <div className="pickme-nav-group" style={{ marginTop: "16px" }}>
          <div className="pickme-nav-group-title">Configuration</div>
          <nav className="pickme-nav-list">
            {CONFIG_NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `pickme-nav-item ${isActive ? "active" : ""}`
                }
              >
                <span className="material-symbols-outlined pickme-nav-icon">
                  {item.icon}
                </span>
                <span className="pickme-nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* User Card & Sign Out */}
      <div className="pickme-sidebar-footer">
        <div className="pickme-user-card">
          <div className="pickme-user-info">
            <div className="pickme-avatar">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                person
              </span>
            </div>
            <div className="pickme-user-details">
              <div className="pickme-user-name">
                {admin?.name || "Operations Admin"}
              </div>
              <div className="pickme-user-role">
                {admin?.email || admin?.phoneNumber || "Admin"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="pickme-logout-btn"
            title="Sign out"
            aria-label="Sign out"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px" }}
            >
              logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
