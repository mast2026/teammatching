import { Search } from "lucide-react";

export function SearchBar({ value, onChange, placeholder = "검색", className = "" }) {
  return (
    <label className={`search-box ${className}`.trim()}>
      <Search size={18} strokeWidth={2.2} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
