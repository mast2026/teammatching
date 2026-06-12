import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { get } from "../../api.js";
import { go } from "../../lib/navigation.js";
import { ApplicationCard } from "../../components/ApplicationCard.jsx";
import { EmptyState } from "../../components/EmptyState.jsx";
import { FilterTabs } from "../../components/FilterTabs.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";

export function MyApplications() {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("active");

  useEffect(() => {
    get("/applications/my").then(setRows).catch(() => setRows([]));
  }, []);

  const active = useMemo(
    () => rows.filter((row) => ["pending", "accepted"].includes(row.status)),
    [rows]
  );
  const history = useMemo(
    () => rows.filter((row) => !["pending", "accepted"].includes(row.status)),
    [rows]
  );
  const list = tab === "active" ? active : history;

  return (
    <>
      <PageHeader title="내 지원 현황" subtitle="진행 중인 프로젝트와 지원 내역을 확인하세요" />
      <FilterTabs
        items={[
          { value: "active", label: `진행 중 (${active.length})` },
          { value: "history", label: `지원 내역 (${history.length})` }
        ]}
        value={tab}
        onChange={setTab}
      />
      {list.length ? (
        <section className="stack-list">
          {list.map((row) => (
            <ApplicationCard key={row.id} application={row} />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={tab === "active" ? "진행 중인 지원이 없습니다" : "과거 지원 내역이 없습니다"}
          description="모집 중인 팀을 찾아 지원해보세요."
          action={
            <button type="button" className="btn btn-soft btn-sm" onClick={() => go("/teams")}>
              팀 매칭 보러가기
            </button>
          }
        />
      )}
    </>
  );
}
