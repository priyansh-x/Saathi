/** Last four digits only. Never return a full phone. */
export function maskPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 4) return `••••${digits.slice(-4)}`;
  if (raw.includes("@")) {
    const [, domain] = raw.split("@");
    return `••••@${domain || "…"}`;
  }
  return "••••";
}
