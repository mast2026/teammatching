export function ContestTeamSummary({ summary }) {
  if (!summary) return null;

  const items = [];
  if (summary.recruiting > 0) {
    items.push({ key: "recruiting", label: `${summary.recruiting}팀 모집중` });
  }
  if (summary.matched > 0) {
    items.push({ key: "matched", label: `${summary.matched}팀 매칭완료` });
  }

  if (!items.length) return null;

  return (
    <span className="contest-team-summary">
      {items.map((item) => (
        <span key={item.key} className={`contest-team-summary-item ${item.key}`}>
          {item.label}
        </span>
      ))}
    </span>
  );
}
