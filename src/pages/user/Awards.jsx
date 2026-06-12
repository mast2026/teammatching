import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { get } from "../../api.js";
import { AwardCard } from "../../components/AwardCard.jsx";
import { EmptyState } from "../../components/EmptyState.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
export function Awards() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    get("/awards").then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <>
      <PageHeader title="입상 결과" subtitle="MAST 팀 매칭을 통해 참여한 공모전 성과" />
      {rows.length ? (
        <section className="stack-list">
          {rows.map((award) => (
            <AwardCard key={award.id} award={award} />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={Trophy}
          title="아직 등록된 입상 결과가 없습니다"
          description="프로젝트가 종료되고 입상 결과가 등록되면 여기에 표시됩니다."
        />
      )}
    </>
  );
}
