import { prisma } from "@/lib/db/prisma";
import { ADMIN_CHAT_CHANNELS, ADMIN_MANAGEMENT_CATEGORIES } from "@/lib/admin/constants";

export async function bootstrapAdminResources() {
  await Promise.all([
    ...ADMIN_CHAT_CHANNELS.map((channel) =>
      prisma.chatChannel.upsert({
        where: { slug: channel.slug },
        create: {
          id: channel.id,
          slug: channel.slug,
          name: channel.name,
          description: channel.description,
          adminOnly: true,
        },
        update: {
          name: channel.name,
          description: channel.description,
          adminOnly: true,
        },
      }),
    ),
    ...ADMIN_MANAGEMENT_CATEGORIES.map((category) =>
      prisma.adminManagementCategory.upsert({
        where: { slug: category.slug },
        create: {
          id: category.id,
          slug: category.slug,
          name: category.name,
          description: category.description,
          href: category.href,
          enabled: true,
        },
        update: {
          name: category.name,
          description: category.description,
          href: category.href,
          enabled: true,
        },
      }),
    ),
  ]);
}

export async function listEnabledAdminCategories() {
  await bootstrapAdminResources();
  return prisma.adminManagementCategory.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
  });
}
