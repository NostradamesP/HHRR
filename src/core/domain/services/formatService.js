export function cleanValue(value) {
  return String(value ?? "").trim();
}

export function displayPersonName(name) {
  const clean = cleanValue(name);
  if (!clean) return "";
  return clean === "Demo NoraHR" ? "IT Manager" : clean;
}
