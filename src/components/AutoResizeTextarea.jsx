import { useEffect, useRef } from "react";

export function AutoResizeTextarea({ value, onChange, minRows = 1, className = "", ...props }) {
  const ref = useRef(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, minRows * 22)}px`;
  };

  useEffect(() => {
    resize();
  }, [value, minRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(event) => {
        onChange(event);
        requestAnimationFrame(resize);
      }}
      rows={minRows}
      className={`auto-resize-field ${className}`.trim()}
      {...props}
    />
  );
}
