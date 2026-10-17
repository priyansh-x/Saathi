export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "ji";
}

export function firstMedicine(medicines: string) {
  const chunk = medicines.split(",")[0]?.trim() || "your morning tablet";
  return chunk;
}
