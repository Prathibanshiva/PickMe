import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getBreadcrumbs = (): string[] => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") {
      return ["Console", "Operations Command"];
    }
    if (path.startsWith("/permission-denied")) {
      return ["Console", "Operations Command", "Access Restricted"];
    }
    const segment = path.replace("/", "").replace(/-/g, " ");
    const formatted = segment.charAt(0).toUpperCase() + segment.slice(1);
    return ["Console", formatted];
  };

  return (
    <div className="pickme-app-shell">
      {/* Desktop Sidebar */}
      <div className="pickme-desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div
          className="pickme-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="pickme-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="pickme-main-wrapper">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          breadcrumbs={getBreadcrumbs()}
        />
        <main className="pickme-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
