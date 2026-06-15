import { useCallback, useEffect, useState } from "react";
import { get, post } from "./api.js";
import { useRoute } from "./hooks/useRoute.js";
import { AdminLayout } from "./layouts/AdminLayout.jsx";
import { Login } from "./layouts/Login.jsx";
import { Splash } from "./layouts/Splash.jsx";
import { UserLayout } from "./layouts/UserLayout.jsx";
import { go, isAdminPath, isAdminUser, normalizePath } from "./lib/navigation.js";
import { AdminDashboard } from "./pages/admin/AdminDashboard.jsx";
import { ContestAdmin } from "./pages/admin/ContestAdmin.jsx";
import { MembersAdmin } from "./pages/admin/MembersAdmin.jsx";
import { AnnouncementsAdmin } from "./pages/admin/AnnouncementsAdmin.jsx";
import { AwardsAdmin } from "./pages/admin/AwardsAdmin.jsx";
import { NotificationsAdmin } from "./pages/admin/NotificationsAdmin.jsx";
import { TeamsAdmin } from "./pages/admin/TeamsAdmin.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { Announcements } from "./pages/user/Announcements.jsx";
import { Awards } from "./pages/user/Awards.jsx";
import { ContestList } from "./pages/user/ContestList.jsx";
import { MyApplications } from "./pages/user/MyApplications.jsx";
import { MyTeam } from "./pages/user/MyTeam.jsx";
import { TeamDetail } from "./pages/user/TeamDetail.jsx";
import { TeamsList } from "./pages/user/TeamsList.jsx";
import { UserDashboard } from "./pages/user/UserDashboard.jsx";

function AdminRouter({ path }) {
  const current = normalizePath(path);
  if (current === "/admin") return <AdminDashboard />;
  if (current === "/admin/contests") return <ContestAdmin />;
  if (current === "/admin/members") return <MembersAdmin />;
  if (current === "/admin/teams") return <TeamsAdmin />;
  if (current === "/admin/awards") return <AwardsAdmin />;
  if (current === "/admin/announcements") return <AnnouncementsAdmin />;
  if (current === "/admin/notifications") return <NotificationsAdmin />;
  return <NotFound admin />;
}

function UserRouter({ path, user, search, onSearchChange }) {
  const current = normalizePath(path);

  if (current === "/" || current === "/dashboard") return <UserDashboard user={user} search={search} />;
  if (current === "/contests") return <ContestList search={search} onSearchChange={onSearchChange} />;
  if (current === "/teams") return <TeamsList search={search} onSearchChange={onSearchChange} />;
  if (current.startsWith("/teams/")) return <TeamDetail id={Number(current.split("/")[2])} user={user} />;
  if (current === "/my-team") return <MyTeam user={user} />;
  if (current === "/my-applications") return <MyApplications />;
  if (current === "/awards") return <Awards />;
  if (current === "/announcements") return <Announcements />;
  return <NotFound />;
}

export default function App() {
  const path = useRoute();
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [search, setSearch] = useState("");

  const loadMe = useCallback(async () => {
    try {
      const res = await get("/auth/me");
      setUser(res.member ?? null);
    } catch {
      setUser(null);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (user && isAdminPath(path) && !isAdminUser(user)) {
      go("/dashboard");
    }
  }, [user, path]);

  const logout = async () => {
    await post("/auth/logout", {});
    setUser(null);
    setSearch("");
    go("/");
  };

  if (booting) return <Splash />;

  const currentPath = normalizePath(path);

  if (!user && currentPath === "/admin") {
    return <Login onLogin={setUser} />;
  }

  if (!user) {
    return <Login onLogin={setUser} memberMode />;
  }

  if (isAdminPath(currentPath)) {
    if (!isAdminUser(user)) {
      return (
        <UserLayout user={user} path={currentPath} onLogout={logout} onUserUpdate={setUser}>
          <UserRouter path={currentPath} user={user} search={search} onSearchChange={setSearch} />
        </UserLayout>
      );
    }

    return (
      <AdminLayout user={user} path={currentPath} onLogout={logout}>
        <AdminRouter key={currentPath} path={currentPath} />
      </AdminLayout>
    );
  }

  return (
    <UserLayout user={user} path={currentPath} onLogout={logout} onUserUpdate={setUser}>
      <UserRouter key={currentPath} path={currentPath} user={user} search={search} onSearchChange={setSearch} />
    </UserLayout>
  );
}
