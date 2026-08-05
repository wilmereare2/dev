function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getDesignatedAdminEmails() {
  const raw = process.env.ADMIN_EMAIL ?? process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

export function isDesignatedAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  const designated = getDesignatedAdminEmails();
  return designated.length > 0 && designated.includes(normalized);
}
