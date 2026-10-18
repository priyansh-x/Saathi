/** India-first E.164. Ten-digit mobiles become +91XXXXXXXXXX. */

export function digitsOf(phone: string) {
  const raw = phone.replace(/\D/g, "");
  if (raw.length === 12 && raw.startsWith("91")) return raw.slice(2);
  if (raw.length === 11 && raw.startsWith("0")) return raw.slice(1);
  return raw;
}

export function toE164(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  return null;
}
