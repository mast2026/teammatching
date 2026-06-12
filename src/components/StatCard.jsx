export function StatCard({ icon: Icon, value, label, tone = "blue" }) {
  return (
    <div className="stat-card">
      <span className={`stat-card-icon ${tone}`}>
        <Icon size={22} strokeWidth={2} />
      </span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}
