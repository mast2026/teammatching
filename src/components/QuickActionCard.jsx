import { go } from "../lib/navigation.js";

export function QuickActionCard({ icon: Icon, title, href }) {
  return (
    <button type="button" className="dash-action-card" onClick={() => go(href)}>
      <span className="dash-action-icon-wrap">
        <Icon size={20} strokeWidth={1.7} className="dash-action-icon" />
      </span>
      <span className="dash-action-label">{title}</span>
    </button>
  );
}
