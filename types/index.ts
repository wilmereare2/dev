export type Role = "ADMIN" | "EDITOR" | "MODERATOR" | "VIEWER" | "USER";

export type NavItem = {
  href: string;
  label: string;
  comingSoon?: boolean;
};
