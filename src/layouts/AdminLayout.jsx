import {
  BellRing,
  LayoutDashboard,
  LogOut,
  Medal,
  Megaphone,
  Trophy,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { adminNav, go, isAdminNavActive } from "../lib/navigation.js";

const navIcons = {
  "/admin": LayoutDashboard,
  "/admin/contests": Trophy,
  "/admin/members": UserRoundCog,
  "/admin/teams": UsersRound,
  "/admin/awards": Medal,
  "/admin/announcements": Megaphone,
  "/admin/notifications": BellRing,
};

export function AdminLayout({ children, user, path, onLogout }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <button type="button" className="user-sidebar-brand admin-sidebar-brand" onClick={() => go("/admin")}>
          <BrandLogo />
          <small className="admin-brand-badge">관리자</small>
        </button>
        <nav className="user-sidebar-nav">
          {adminNav.map((item) => {
            const Icon = navIcons[item.href] ?? LayoutDashboard;
            const active = isAdminNavActive(path, item.href);
            return (
              <button
                key={item.href}
                type="button"
                className={`user-sidebar-link ${active ? "active" : ""}`}
                onClick={() => go(item.href)}
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="user-sidebar-footer admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <strong>{user?.name}</strong>
            <span>{user?.school}</span>
          </div>
          <button type="button" className="user-sidebar-link muted" onClick={onLogout}>
            <LogOut size={18} strokeWidth={1.8} />
            로그아웃
          </button>
        </div>
      </aside>
      <main className="admin-content admin-compact">{children}</main>
    </div>
  );
}
