const USERNAME_PATTERN = /^[a-zA-Z0-9]{3,20}$/;

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidUsername(raw: string) {
  return USERNAME_PATTERN.test(normalizeUsername(raw));
}

export function usernameValidationMessage(raw: string) {
  const value = normalizeUsername(raw);
  if (value.length < 3) return "Username must be at least 3 characters.";
  if (value.length > 20) return "Username must be 20 characters or fewer.";
  if (!USERNAME_PATTERN.test(value)) {
    return "Username can only use letters and numbers (no spaces or special characters).";
  }
  return null;
}

export function displayHandle(username: string | null | undefined, name?: string | null) {
  if (username) return `@${username}`;
  return name?.trim() || "Member";
}
