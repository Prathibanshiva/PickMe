import React from "react";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  onToggleMobileMenu: () => void;
  breadcrumbs?: string[];
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  breadcrumbs = ["Console", "Operations Command"],
}) => {
  const { admin } = useAuth();

  return (
    <header className="pickme-header">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="pickme-header-left">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="pickme-mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
            menu
          </span>
        </button>

        <nav className="pickme-breadcrumbs">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              {idx > 0 && (
                <span
                  className="material-symbols-outlined pickme-breadcrumb-separator"
                  style={{ fontSize: "14px" }}
                >
                  chevron_right
                </span>
              )}
              <span
                className={`pickme-breadcrumb-item ${
                  idx === breadcrumbs.length - 1 ? "current" : ""
                }`}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Center: Quick Search */}
      <div className="pickme-header-center">
        <div className="pickme-search-bar">
          <span
            className="material-symbols-outlined pickme-search-icon"
            style={{ fontSize: "18px" }}
          >
            search
          </span>
          <input
            type="text"
            className="pickme-search-input"
            placeholder="Search drivers, rides, users..."
            readOnly
            title="Search will be available in Phase B"
          />
        </div>
      </div>

      {/* Right: Live Pulse & Profile */}
      <div className="pickme-header-right">
        {/* Operations Live Status */}
        <div className="pickme-status-pill">
          <span className="pickme-status-dot" />
          <span className="pickme-status-text">Operations Active</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="pickme-icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "22px" }}
          >
            notifications
          </span>
          <span className="pickme-notification-dot" />
        </button>

        {/* User Avatar */}
        <div
          className="pickme-avatar pickme-avatar-sm"
          title={admin?.name || "Operations Admin"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            person
          </span>
        </div>
      </div>
    </header>
  );
};
