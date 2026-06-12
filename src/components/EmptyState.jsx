export function EmptyState({ icon: Icon, title, description, action, inset = false }) {
  return (
    <article className={`empty-state ${inset ? "inset" : ""}`}>
      {Icon && (
        <span className="empty-state-icon">
          <Icon size={22} strokeWidth={1.5} />
        </span>
      )}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </article>
  );
}
