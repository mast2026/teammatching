import { Trophy } from "lucide-react";

export function AwardCard({ award }) {
  return (
    <article className="award-card award-card-compact">
      <div className="award-card-icon">
        <Trophy size={18} />
      </div>
      <div>
        <span className="award-result">{award.awardResult}</span>
        <h3>{award.contestTitle}</h3>
        {award.body && <p>{award.body}</p>}
      </div>
    </article>
  );
}
