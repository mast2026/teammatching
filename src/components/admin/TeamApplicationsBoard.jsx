import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { post } from "../../api.js";
import { StatusBadge } from "../StatusBadge.jsx";

function countByStatus(apps, status) {
  return apps.filter((app) => app.status === status).length;
}

function TeamApplicationCard({ team, applications, onRefresh }) {
  const [open, setOpen] = useState(false);
  const pending = countByStatus(applications, "pending");
  const accepted = countByStatus(applications, "accepted");
  const rejected = countByStatus(applications, "rejected");
  const total = applications.length;

  const handleAction = async (id, action) => {
    await post(`/applications/${id}/${action}`, {});
    onRefresh?.();
  };

  return (
    <article className={`admin-team-app-card ${open ? "open" : ""}`}>
      <button type="button" className="admin-team-app-card-head" onClick={() => setOpen(!open)}>
        <div className="admin-team-app-card-title">
          <strong>{team.contestTitle}</strong>
          <span>{team.leaderName} 팀장 · {team.currentMembers}/{team.requiredMembers}명</span>
        </div>
        <div className="admin-team-app-card-meta">
          <div className="admin-app-stat-row">
            <span className="admin-app-stat total">지원 {total}</span>
            <span className="admin-app-stat pending">검토 {pending}</span>
            <span className="admin-app-stat accepted">수락 {accepted}</span>
            <span className="admin-app-stat rejected">거절 {rejected}</span>
          </div>
          <StatusBadge status={team.status} />
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="admin-team-app-card-body">
          {applications.length ? (
            <ul className="admin-app-list">
              {applications.map((app) => (
                <li key={app.id} className={`admin-app-item status-${app.status}`}>
                  <div className="admin-app-item-main">
                    <strong>{app.applicantName}</strong>
                    <span>
                      {app.applicantSchool}
                      {app.applicantGeneration ? ` · ${app.applicantGeneration}기` : ""}
                    </span>
                    {app.message && <p>{app.message}</p>}
                  </div>
                  <div className="admin-app-item-side">
                    <StatusBadge status={app.status} />
                    {app.status === "pending" && (
                      <div className="admin-app-item-actions">
                        <button type="button" className="btn btn-primary btn-xs" onClick={() => handleAction(app.id, "accept")}>
                          승인
                        </button>
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleAction(app.id, "reject")}>
                          거절
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-line">아직 지원자가 없습니다.</p>
          )}
        </div>
      )}
    </article>
  );
}

export function TeamApplicationsBoard({ teams, applications, onRefresh }) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const team of teams) {
      map.set(team.id, { team, applications: [] });
    }
    for (const app of applications) {
      if (!map.has(app.teamId)) {
        map.set(app.teamId, {
          team: {
            id: app.teamId,
            contestTitle: app.contestTitle,
            leaderName: app.leaderName,
            currentMembers: "-",
            requiredMembers: "-",
            status: app.teamStatus ?? "recruiting",
          },
          applications: [],
        });
      }
      map.get(app.teamId).applications.push(app);
    }
    return Array.from(map.values()).sort((a, b) => b.applications.length - a.applications.length);
  }, [teams, applications]);

  const summary = useMemo(
    () => ({
      total: applications.length,
      pending: countByStatus(applications, "pending"),
      accepted: countByStatus(applications, "accepted"),
      rejected: countByStatus(applications, "rejected"),
    }),
    [applications]
  );

  if (!grouped.length) {
    return <p className="empty-line">등록된 팀이 없습니다.</p>;
  }

  return (
    <div className="admin-team-apps-board">
      <div className="admin-app-board-summary">
        <span>전체 지원 <strong>{summary.total}</strong></span>
        <span className="pending">검토 중 <strong>{summary.pending}</strong></span>
        <span className="accepted">수락 <strong>{summary.accepted}</strong></span>
        <span className="rejected">거절 <strong>{summary.rejected}</strong></span>
      </div>
      <div className="admin-team-apps-list">
        {grouped.map(({ team, applications: teamApps }) => (
          <TeamApplicationCard
            key={team.id}
            team={team}
            applications={teamApps}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}
