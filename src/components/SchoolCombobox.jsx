import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filterSchools } from "../lib/schools.js";

export function SchoolCombobox({ value, onChange, required = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value ?? "");
  const wrapRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const matches = useMemo(() => filterSchools(query), [query]);

  const pick = (school) => {
    setQuery(school);
    onChange(school);
    setOpen(false);
  };

  const showList = open && query.trim().length > 0 && matches.length > 0;

  return (
    <div className="school-combobox" ref={wrapRef}>
      <input
        value={query}
        required={required}
        placeholder="학교명 입력"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          onChange(next);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {showList && (
        <ul id={listId} className="school-combobox-list" role="listbox">
          {matches.map((school) => (
            <li key={school}>
              <button
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(school)}
              >
                {school}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
