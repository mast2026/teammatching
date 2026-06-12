let pathListener = null;

export function normalizePath(path) {
  const value = path || "/";
  return value.replace(/\/+$/, "") || "/";
}

export function route() {
  return normalizePath(window.location.pathname || "/");
}

export function bindPathListener(listener) {
  pathListener = listener;
}

export function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

export function go(path) {
  const [rawPath = "/", rawSearch = ""] = String(path).split("?");
  const pathname = normalizePath(rawPath);
  const search = rawSearch ? `?${rawSearch}` : "";
  const nextUrl = `${pathname}${search}`;
  const currentUrl = `${route()}${window.location.search || ""}`;
  if (nextUrl !== currentUrl) {
    window.history.pushState(null, "", nextUrl);
  }
  pathListener?.(pathname);
  window.dispatchEvent(new Event("mast:navigate"));
}

export function isAdminPath(path) {
  return normalizePath(path).startsWith("/admin");
}

export function isAdminUser(user) {
  return ["admin", "professor"].includes(user?.role);
}

export function isAdminNavActive(path, href) {
  const current = normalizePath(path);
  const target = normalizePath(href);
  if (target === "/admin") return current === "/admin";
  return current === target || current.startsWith(`${target}/`);
}

export const userNavMain = [
  { href: "/contests", label: "공모전" },
  { href: "/teams", label: "팀 매칭" },
  { href: "/my-applications", label: "내 지원 현황" },
  { href: "/my-team", label: "내 팀 관리" },
];

export const userNavFooter = [
  { href: "/awards", label: "입상 결과" },
  { href: "/announcements", label: "공지사항" },
];

export const userNav = [...userNavMain, ...userNavFooter];

export const adminNav = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/contests", label: "공모전" },
  { href: "/admin/members", label: "회원" },
  { href: "/admin/teams", label: "팀·지원" },
  { href: "/admin/awards", label: "입상 결과" },
  { href: "/admin/announcements", label: "공지사항" },
  { href: "/admin/notifications", label: "알림 발송" },
];
