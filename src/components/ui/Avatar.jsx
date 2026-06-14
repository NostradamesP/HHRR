import { displayPersonName } from "../../lib/utils";

export default function Avatar({ name, size = "sm" }) {
  const dim = size === "lg" ? "h-11 w-11 text-base" : "h-7 w-7 text-xs";
  const visibleName = displayPersonName(name);
  return (
    <span
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full bg-cyan-600 font-bold text-white shadow-sm`}
    >
      {(visibleName || "?").charAt(0).toUpperCase()}
    </span>
  );
}
