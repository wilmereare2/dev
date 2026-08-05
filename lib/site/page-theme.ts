export type PageBackgroundVariant = "default" | "library" | "profile" | "premium" | "creator";

export function resolvePageBackground(pathname: string): PageBackgroundVariant {
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/pricing") || pathname.startsWith("/subscriptions")) return "premium";
  if (pathname.startsWith("/creator") || pathname.startsWith("/create")) return "creator";
  if (pathname.startsWith("/account") || pathname.startsWith("/settings") || pathname.startsWith("/messages")) {
    return "profile";
  }
  return "default";
}
