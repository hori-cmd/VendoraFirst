import "./Navigation.css";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";
import { initials } from "../utils/helpers";

const adminNavigation = [
  ["admin-dashboard", "Dashboard", LayoutDashboard],
  ["users", "Users", Users],
  ["shops-products", "Shops & Products", Store],
  ["orders", "Orders", ShoppingBag],
  ["reports-analytics", "Reports & Analytics", BarChart3],
  ["system-security", "System & Security", Shield],
  ["settings", "Settings", Settings],
];

const staffNavigation = [
  ["staff-dashboard", "Dashboard", LayoutDashboard],
  ["users", "Users", Users],
  ["shops-products", "Shops & Products", Store],
  ["orders", "Orders", ShoppingBag],
  ["reports-analytics", "Reports & Analytics", BarChart3],
  ["system-security", "System & Security", Shield],
  ["settings", "Settings", Settings],
];

export default function ModerationSidebar({
  user,
  page,
  setPage,
  mobileOpen,
  setMobileOpen,
  onLogout,
}) {
  const isAdmin = user.role === "admin";
  const navigationItems = isAdmin ? adminNavigation : staffNavigation;
  const roleLabel = isAdmin ? "Administrator" : "Staff";
  const avatarLabel = isAdmin ? "AD" : initials(user.name);

  // Keep the active view and mobile drawer in sync with the main app shell.
  const navigate = (nextPage) => {
    setPage(nextPage);
    setMobileOpen(false);
  };

  return (
    <aside className={`sidebar moderation-side ${mobileOpen ? "open" : ""}`}>
      <div className="brand side-brand">
        <span className="brand-mark">V</span>
        <span>Vendora</span>
      </div>
      <button
        className="close-mobile"
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
      >
        <X />
      </button>
      <div className="moderation-role">
        <Shield size={14} />
        <span>{roleLabel}</span>
      </div>
      <nav>
        {navigationItems.map(([key, label, Icon]) => (
          <button
            className={page === key ? "active" : ""}
            key={key}
            onClick={() => navigate(key)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
      <div className="side-bottom">
        <div className="mini-profile">
          <div className="avatar">{avatarLabel}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{roleLabel}</small>
          </div>
        </div>
        <button onClick={onLogout}>
          <LogOut size={17} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
