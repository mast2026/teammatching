import { StatusBadge } from "./StatusBadge.jsx";
import { formatDate, truncate } from "../lib/format.js";

export function ApplicationCard({ application }) {
  return (
    <article className="application-card">
      <div className="application-card-top">
        <div>
          <h3>{application.contestTitle}</h3>
          <p className="team-leader">{application.leaderName} 팀장</p>
        </div>
        <StatusBadge status={application.status} />
      </div>
      {application.message && <p className="application-message">{truncate(application.message, 100)}</p>}
      <div className="application-meta">
        <span>지원일 {formatDate(application.created_at)}</span>
        {application.surveyRole && <span>희망 역할 {application.surveyRole}</span>}
      </div>
    </article>
  );
}
