export type MessageGroupPosition = "single" | "first" | "middle" | "last";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function formatBubbleTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateDivider(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}

export function isSameCalendarDay(a: string, b: string) {
  const left = new Date(a);
  const right = new Date(b);
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function groupsWithPrevious<T extends { createdAt: string }>(
  previous: T | undefined,
  current: T,
  sameSender: (left: T, right: T) => boolean,
) {
  if (!previous) return false;
  if (!sameSender(previous, current)) return false;
  if (!isSameCalendarDay(previous.createdAt, current.createdAt)) return false;
  return new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime() <= GROUP_WINDOW_MS;
}

export function getMessageGroupPosition<T extends { createdAt: string }>(
  messages: T[],
  index: number,
  sameSender: (left: T, right: T) => boolean,
): MessageGroupPosition {
  const current = messages[index];
  const hasPrevious = groupsWithPrevious(messages[index - 1], current, sameSender);
  const hasNext =
    index + 1 < messages.length && groupsWithPrevious(current, messages[index + 1], sameSender);

  if (!hasPrevious && !hasNext) return "single";
  if (!hasPrevious && hasNext) return "first";
  if (hasPrevious && hasNext) return "middle";
  return "last";
}
