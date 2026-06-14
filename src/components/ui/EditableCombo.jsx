import { useState, useEffect, useMemo, useRef } from "react";
import { uniqueOptions, cleanValue } from "../../lib/utils";

export default function EditableCombo({
  value,
  options = [],
  onCommit,
  placeholder = "Sin definir",
  className = "",
}) {
  const [draft, setDraft] = useState(value || "");
  const listIdRef = useRef(`combo-${Math.random().toString(36).slice(2)}`);
  const cleanOptions = useMemo(() => uniqueOptions([value, ...options]), [value, options]);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  function commit() {
    const next = cleanValue(draft);
    if ((value || "") !== next) onCommit?.(next);
  }

  return (
    <>
      <input
        value={draft}
        list={listIdRef.current}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      <datalist id={listIdRef.current}>
        {cleanOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}
