import { statusLabel, statusTone } from "../lib/format.js";

export function StatusBadge({ status }) {
  const tone = statusTone(status);
  return <span className={`status-badge ${tone}`}>{statusLabel(status)}</span>;
}
