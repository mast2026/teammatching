import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { get } from "../../api.js";
import { EmptyState } from "../../components/EmptyState.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";

export function Announcements() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    get("/announcements").then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <>
      <PageHeader title="공지사항" subtitle="MAST 팀 매칭 플랫폼 소식과 안내" />
      {rows.length ? (
        <ul className="announcement-list">
          {rows.map((item) => (
            <li key={item.id} className="announcement-item announcement-item-compact">
              <div className="announcement-item-head">
                <h3>{item.title}</h3>
                <time>{(item.publishedAt || item.createdAt || "").slice(0, 10).replace(/-/g, ".")}</time>
              </div>
              {item.body && <p>{item.body}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="등록된 공지가 없습니다"
          description="새 공지가 올라오면 이곳에서 확인할 수 있습니다."
        />
      )}
    </>
  );
}
