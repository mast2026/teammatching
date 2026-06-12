import { post } from "../api.js";
import { StatusBadge } from "./StatusBadge.jsx";
import { truncate } from "../lib/format.js";
import { go } from "../lib/navigation.js";

export function TeamCard({ team, admin, onRefresh, applicationCount = 0, showApply = true, list = false }) {
  const memberCount = team.members?.length ?? team.currentMembers ?? 0;
  const progress = team.requiredMembers ? Math.min(100, (memberCount / team.requiredMembers) * 100) : 0;

  if (list) {
    return (
      <article className="team-card team-card-list">
        <div className="team-card-list-body">
          <div className="team-card-list-top">
            <StatusBadge status={team.status} />
            <span className="meta-muted">{team.leaderSchool || "온라인"}</span>
          </div>
          <h3 className="line-clamp-1">{team.contestTitle}</h3>
          <p className="team-list-meta line-clamp-1">
            {team.leaderName} 팀장 · {memberCount}/{team.requiredMembers}명
            {applicationCount > 0 ? ` · 지원 ${applicationCount}명` : ""}
          </p>
        </div>
        <div className="team-card-list-aside">
          <div className="team-progress-bar compact">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="card-actions">
            <button type="button" className="btn btn-outline btn-xs" onClick={() => go(`/teams/${team.id}`)}>
              상세
            </button>
            {showApply && team.status === "recruiting" && (
              <button type="button" className="btn btn-accent btn-xs" onClick={() => go(`/teams/${team.id}`)}>
                지원하기
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="team-card">
      <div className="team-card-top">
        <StatusBadge status={team.status} />
        <span className="meta-muted">{team.leaderSchool || "온라인"}</span>
      </div>
      <h3 className="line-clamp-2">{team.contestTitle}</h3>
      <p className="team-leader line-clamp-1">
        {team.leaderName} 팀장 · {team.leaderSchool || "-"}
        {team.leaderMajor ? ` · ${team.leaderMajor}` : ""}
      </p>
      {team.introduction && <p className="team-intro line-clamp-2">{truncate(team.introduction, 100)}</p>}
      <div className="team-progress">
        <div className="team-progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="meta-muted">
          {memberCount}/{team.requiredMembers}명
        </span>
        {applicationCount > 0 && <span className="meta-muted">지원 {applicationCount}명</span>}
      </div>
      <div className="team-card-footer">
        <div className="card-actions">
          <button type="button" className="btn btn-outline btn-xs" onClick={() => go(`/teams/${team.id}`)}>
            상세
          </button>
          {showApply && team.status === "recruiting" && (
            <button type="button" className="btn btn-accent btn-xs" onClick={() => go(`/teams/${team.id}`)}>
              지원하기
            </button>
          )}
        </div>
      </div>
      {admin && (
        <div className="row-actions">
          <button
            type="button"
            onClick={async () => {
              await post(`/teams/${team.id}/close`, {});
              onRefresh?.();
            }}
          >
            매칭 완료
          </button>
          <button
            type="button"
            onClick={async () => {
              const awardResult = window.prompt("입상 결과");
              if (awardResult !== null) {
                await post(`/teams/${team.id}/award`, { awardResult });
                onRefresh?.();
              }
            }}
          >
            수상 입력
          </button>
        </div>
      )}
    </article>
  );
}
