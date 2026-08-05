export const ADMIN_CHAT_CHANNELS = [
  {
    id: "admin-operations",
    slug: "admin-operations",
    name: "Admin Operations",
    description: "Private coordination channel for platform administrators.",
  },
  {
    id: "moderation-desk",
    slug: "moderation-desk",
    name: "Moderation Desk",
    description: "Real-time moderation updates and escalations.",
  },
  {
    id: "platform-alerts",
    slug: "platform-alerts",
    name: "Platform Alerts",
    description: "Automated and manual alerts for administrators.",
  },
] as const;

export const ADMIN_MANAGEMENT_CATEGORIES = [
  {
    id: "promotions-monitoring",
    slug: "promotions-monitoring",
    name: "Promotions monitoring",
    description: "View and manage member promotional posts in real time.",
    href: "/admin/promotions",
  },
  {
    id: "content-moderation",
    slug: "content-moderation",
    name: "Content moderation",
    description: "Review creator uploads before they go live.",
    href: "/admin/content",
  },
  {
    id: "creator-verification",
    slug: "creator-verification",
    name: "Creator verification",
    description: "Approve or suspend creator accounts.",
    href: "/admin/creators",
  },
  {
    id: "member-support",
    slug: "member-support",
    name: "Member support",
    description: "Handle reports, tickets, and customer issues.",
    href: "/admin/tickets",
  },
  {
    id: "customer-management",
    slug: "customer-management",
    name: "Customer management",
    description: "Search members, roles, and account status.",
    href: "/admin/users",
  },
] as const;
