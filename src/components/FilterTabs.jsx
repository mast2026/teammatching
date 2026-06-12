export function FilterTabs({ items, value, onChange }) {
  return (
    <div className="filter-tabs">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={value === item.value ? "active" : ""}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
