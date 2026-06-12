import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { get } from "../api.js";
import { go } from "../lib/navigation.js";
import { attachReadState, countUnread, markNotificationsRead } from "../lib/notifications.js";
import { formatDate } from "../lib/format.js";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const wrapRef = useRef(null);

  const refresh = () => {
    get("/notifications")
      .then((res) => setItems(attachReadState(res.items ?? [])))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("mast:navigate", refresh);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("mast:navigate", refresh);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const unread = countUnread(items);

  const handleItemClick = async (item) => {
    await markNotificationsRead([item.id]);
    setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
    setOpen(false);
    if (item.href) go(item.href);
  };

  const markAllRead = async () => {
    const ids = items.filter((item) => !item.read).map((item) => item.id);
    await markNotificationsRead(ids);
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="header-popover-wrap" ref={wrapRef}>
      <button type="button" className="icon-btn" aria-label="알림" onClick={() => setOpen((prev) => !prev)}>
        <Bell size={18} />
        {unread > 0 && <span className="badge-count">{unread}</span>}
      </button>
      {open && (
        <div className="header-popover notification-popover">
          <div className="header-popover-head">
            <strong>알림</strong>
            {unread > 0 && (
              <button type="button" className="text-btn small" onClick={markAllRead}>
                모두 읽음
              </button>
            )}
          </div>
          {items.length ? (
            <ul className="notification-list">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notification-item ${item.read ? "read" : ""}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <span className="notification-title">{item.title}</span>
                    <span className="notification-body">{item.body}</span>
                    <span className="notification-time">{formatDate(item.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="header-popover-empty">새 알림이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
