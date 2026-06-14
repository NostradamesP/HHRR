export const APP_NAME = "Kanban IT Department";
export const APP_MONOGRAM = "IT";

const LEGACY_BOARD_NAMES = new Set(["Nora", "NoraHR", "NoraHR Roadmap", "NoraHR Roadmap Kanban"]);

export function displayBoardName(name) {
  const cleanName = String(name || "").trim();
  if (!cleanName) return APP_NAME;
  return LEGACY_BOARD_NAMES.has(cleanName) ? APP_NAME : cleanName;
}
