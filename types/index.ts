export type Role = "ADMIN" | "EDITOR" | "MODERATOR" | "VIEWER" | "USER" | "CREATOR" | "BUSINESS";

export type ContentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "flagged"
  | "removed"
  | "published";

export type ContentVisibility = "public" | "followers" | "subscribers" | "private";

export type MediaType = "photo" | "video" | "gallery" | "gif" | "audio" | "preview" | "text";

export type NavItem = {
  href: string;
  label: string;
  comingSoon?: boolean;
};
