export function cleanValue(value) {
  return String(value ?? "").trim();
}

export function sanitizeText(value) {
  return cleanValue(value).replace(/<[^>]*>/g, "");
}

export function displayPersonName(name) {
  const clean = cleanValue(name);
  if (!clean) return "";
  return clean === "Demo NoraHR" ? "IT Manager" : clean;
}
