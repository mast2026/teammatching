import { ContestTeamSummary } from "./ContestTeamSummary.jsx";
import { dDay, splitCategories } from "../lib/format.js";
import { go } from "../lib/navigation.js";

function ddayTone(day) {
  if (!day || day === "마감") return "closed";
  if (day === "D-Day") return "urgent";
  const date = day.startsWith("D-") ? Number(day.slice(2)) : null;
  if (date !== null && date <= 7) return "urgent";
  return "";
}

export function ContestCard({ contest, teamSummary, list = false, embedded = false }) {
  const deadline = contest.registrationDeadline || contest.registrationPeriod;
  const day = dDay(deadline);
  const dayClass = ddayTone(day);
  const categories = splitCategories(contest.category);
  const categoryText = categories.join(" · ");

  if (list) {
    return (
      <article className={`contest-list-item ${embedded ? "embedded" : ""}`}>
        <div className="contest-list-item-head">
          <div className="contest-list-item-tags">
            {day && <span className={`dday-badge ${dayClass}`}>{day}</span>}
            {categoryText && <span className="contest-category-text">{categoryText}</span>}
          </div>
          <ContestTeamSummary summary={teamSummary} />
        </div>
        <h3 className="contest-list-title line-clamp-2">{contest.title}</h3>
        <dl className="contest-list-meta-rows">
          <div>
            <dt>주최</dt>
            <dd className="line-clamp-1">{contest.organizer || "-"}</dd>
          </div>
          <div>
            <dt>접수</dt>
            <dd className="line-clamp-1">
              {contest.registrationPeriod || contest.registrationDeadline || "-"}
            </dd>
          </div>
          <div>
            <dt>상금</dt>
            <dd className="line-clamp-1">{contest.prize || "-"}</dd>
          </div>
        </dl>
        <div className="contest-list-item-actions">
          {contest.link ? (
            <a className="btn btn-outline btn-xs" href={contest.link} target="_blank" rel="noreferrer">
              상세
            </a>
          ) : (
            <button type="button" className="btn btn-outline btn-xs" onClick={() => go("/contests")}>
              상세
            </button>
          )}
          <button type="button" className="btn btn-accent btn-xs" onClick={() => go(`/teams?contest=${contest.id}`)}>
            팀 찾기
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="contest-card">
      <div className="contest-card-badges">
        {day && <span className={`dday-badge ${dayClass}`}>{day}</span>}
        {categories.map((cat) => (
          <span key={cat} className="contest-category-text">
            {cat}
          </span>
        ))}
      </div>
      <h3 className="line-clamp-2">{contest.title}</h3>
      <dl className="meta-list contest-meta-grid">
        <div>
          <dt>주최</dt>
          <dd className="line-clamp-1">{contest.organizer || "-"}</dd>
        </div>
        <div>
          <dt>접수</dt>
          <dd className="line-clamp-1">{contest.registrationPeriod || contest.registrationDeadline || "-"}</dd>
        </div>
        <div>
          <dt>상금</dt>
          <dd className="line-clamp-1">{contest.prize || "-"}</dd>
        </div>
      </dl>
      <div className="contest-card-footer">
        <ContestTeamSummary summary={teamSummary} />
        <div className="card-actions">
          {contest.link ? (
            <a className="btn btn-outline btn-xs" href={contest.link} target="_blank" rel="noreferrer">
              상세
            </a>
          ) : (
            <button type="button" className="btn btn-outline btn-xs" onClick={() => go("/contests")}>
              상세
            </button>
          )}
          <button type="button" className="btn btn-accent btn-xs" onClick={() => go(`/teams?contest=${contest.id}`)}>
            팀 찾기
          </button>
        </div>
      </div>
    </article>
  );
}
