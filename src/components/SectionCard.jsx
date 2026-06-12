import { ChevronRight } from "lucide-react";
import { go } from "../lib/navigation.js";

export function SectionCard({ title, href, children, className = "" }) {
  return (
    <section className={`section-card ${className}`.trim()}>
      <header className="section-card-header">
        <h2>{title}</h2>
        {href && (
          <button type="button" className="link-btn" onClick={() => go(href)}>
            전체 보기 <ChevronRight size={14} />
          </button>
        )}
      </header>
      <div className="section-card-body">{children}</div>
    </section>
  );
}
