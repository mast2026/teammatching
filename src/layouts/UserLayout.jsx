import {
  ClipboardList,
  Medal,
  Megaphone,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { NotificationBell } from "../components/NotificationBell.jsx";
import { ProfileMenu } from "../components/ProfileMenu.jsx";
import { go, isAdminUser, userNavFooter, userNavMain } from "../lib/navigation.js";

const navIcons = {
  "/contests": Trophy,
  "/teams": UsersRound,
  "/my-applications": ClipboardList,
  "/my-team": UserRound,
  "/awards": Medal,
  "/announcements": Megaphone,
};

function isNavActive(path, href) {
  if (href === "/teams") return path === "/teams" || path.startsWith("/teams/");
  return path === href;
}

function NavLink({ item, path, onNavigate, className = "user-sidebar-link" }) {
  const Icon = navIcons[item.href] ?? Trophy;
  const active = isNavActive(path, item.href);
  return (
    <button
      type="button"
      className={`${className} ${active ? "active" : ""}`}
      onClick={() => {
        go(item.href);
        onNavigate?.();
      }}
    >
      <Icon size={18} strokeWidth={1.8} />
      {item.label}
    </button>
  );
}

export function UserLayout({ children, user, path, onLogout, onUserUpdate }) {
  const homePath = isAdminUser(user) ? "/admin" : "/dashboard";

  return (
    <div className="user-shell">
      <aside className="user-sidebar desktop-only">
        <button type="button" className="user-sidebar-brand" onClick={() => go(homePath)}>
          <BrandLogo />
        </button>
        <nav className="user-sidebar-nav">
          {userNavMain.map((item) => (
            <NavLink key={item.href} item={item} path={path} />
          ))}
        </nav>
        <div className="user-sidebar-footer">
          {userNavFooter.map((item) => (
            <NavLink key={item.href} item={item} path={path} />
          ))}
        </div>
      </aside>

      <div className="user-main">
        <header className="user-main-header">
          <button type="button" className="user-header-brand mobile-only" onClick={() => go(homePath)}>
            <BrandLogo />
          </button>
          <div className="user-main-header-actions">
            <NotificationBell />
            <ProfileMenu user={user} onUserUpdate={onUserUpdate} onLogout={onLogout} />
          </div>
        </header>

        <main className="user-content">{children}</main>
      </div>
    </div>
  );
}
