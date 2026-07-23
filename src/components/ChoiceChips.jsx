export function ChoiceChips({ options, value, onChange, multiple = true }) {
  const selected = multiple ? value ?? [] : [value].filter(Boolean);

  const toggle = (option) => {
    if (!multiple) {
      onChange(option);
      return;
    }
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(next);
  };

  return (
    <div className="choice-chip-row">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`choice-chip ${selected.includes(option) ? "active" : ""}`}
          onClick={() => toggle(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
