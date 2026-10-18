export function opsEmails() {
  return (process.env.OPS_EMAILS || "")
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
}

/** Sign-in required and listed on OPS_EMAILS. Empty list means nobody. */
export function canViewOps(email: string | null | undefined) {
  if (!email) return false;
  return opsEmails().includes(email.trim().toLowerCase());
}

export function opsHttpStatus(email: string | null | undefined) {
  return canViewOps(email) ? 200 : 404;
}
