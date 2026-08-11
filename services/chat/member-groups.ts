import { prisma } from "@/lib/db/prisma";
import type {
  GroupMemberPayload,
  GroupMemberRole,
  GroupMessagePayload,
  MemberGroupPayload,
} from "@/lib/chat/constants";
import { CHAT_USER_SELECT, chatDisplayName } from "@/lib/user/public-select";

const userSelect = CHAT_USER_SELECT;
const MAX_GROUP_MEMBERS = 25;
const MAX_GROUP_NAME = 80;

export type GroupVisibility = "private" | "public";

function parseGroupRole(value: string): GroupMemberRole {
  if (value === "creator" || value === "owner") return "creator";
  if (value === "admin") return "admin";
  return "member";
}

function canInviteMembers(role: GroupMemberRole) {
  return role === "creator" || role === "admin";
}

function canManageArchive(role: GroupMemberRole) {
  return role === "creator";
}

function serializeUser(user: {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  role: string;
}) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    image: user.image,
    role: user.role,
    displayName: chatDisplayName(user),
  };
}

function serializeGroupMessage(message: {
  id: string;
  body: string;
  createdAt: Date;
  sender: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    role: string;
  };
}): GroupMessagePayload {
  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    sender: serializeUser(message.sender),
  };
}

function parseVisibility(value: string): GroupVisibility | null {
  return value === "private" || value === "public" ? value : null;
}

async function isBlocked(userA: string, userB: string) {
  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { id: true },
  });
  return Boolean(block);
}

export async function userInMemberGroup(groupId: string, userId: string) {
  const membership = await prisma.memberGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });
  return Boolean(membership);
}

async function getMembership(groupId: string, userId: string) {
  return prisma.memberGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });
}

function mapGroup(
  group: {
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    archivedAt: Date | null;
    updatedAt: Date;
    createdById: string;
    _count: { members: number };
    messages: Array<{
      id: string;
      body: string;
      createdAt: Date;
      sender: { id: string; username: string | null; name: string | null; image: string | null; role: string };
    }>;
  },
  myRole: GroupMemberRole,
): MemberGroupPayload {
  const last = group.messages[0];
  const visibility = parseVisibility(group.visibility) ?? "private";

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    visibility,
    archivedAt: group.archivedAt?.toISOString() ?? null,
    updatedAt: group.updatedAt.toISOString(),
    memberCount: group._count.members,
    createdById: group.createdById,
    myRole,
    lastMessage: last ? serializeGroupMessage(last) : null,
  };
}

const groupInclude = {
  _count: { select: { members: true } },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { sender: { select: userSelect } },
  },
};

export async function listMemberGroups(
  userId: string,
  options?: { includeArchived?: boolean },
): Promise<MemberGroupPayload[]> {
  const memberships = await prisma.memberGroupMember.findMany({
    where: { userId },
    select: { groupId: true, role: true },
  });
  const groupIds = memberships.map((entry) => entry.groupId);
  if (!groupIds.length) return [];

  const roleByGroupId = new Map(memberships.map((entry) => [entry.groupId, parseGroupRole(entry.role)]));

  const groups = await prisma.memberGroup.findMany({
    where: {
      id: { in: groupIds },
      ...(options?.includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: { updatedAt: "desc" },
    include: groupInclude,
  });

  return groups.map((group) => mapGroup(group, roleByGroupId.get(group.id) ?? "member"));
}

export async function listDiscoverablePublicGroups(userId: string): Promise<MemberGroupPayload[]> {
  const groups = await prisma.memberGroup.findMany({
    where: {
      visibility: "public",
      archivedAt: null,
      members: { none: { userId } },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: groupInclude,
  });

  return groups.map((group) => mapGroup(group, "member"));
}

export async function createMemberGroup(
  creatorId: string,
  input: {
    name: string;
    description?: string | null;
    memberIds: string[];
    visibility?: string;
  },
): Promise<{ ok: true; group: MemberGroupPayload } | { ok: false; error: string }> {
  const name = input.name.trim();
  if (name.length < 2) {
    return { ok: false, error: "Group name must be at least 2 characters." };
  }
  if (name.length > MAX_GROUP_NAME) {
    return { ok: false, error: "Group name is too long." };
  }

  const visibility = parseVisibility(input.visibility ?? "private");
  if (!visibility) {
    return { ok: false, error: "Choose private or public access." };
  }

  const uniqueMemberIds = [...new Set(input.memberIds.filter((id) => id !== creatorId))];
  if (uniqueMemberIds.length + 1 > MAX_GROUP_MEMBERS) {
    return { ok: false, error: `Groups can have up to ${MAX_GROUP_MEMBERS} members.` };
  }

  for (const memberId of uniqueMemberIds) {
    if (await isBlocked(creatorId, memberId)) {
      return { ok: false, error: "One or more selected members cannot be added." };
    }
  }

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: uniqueMemberIds } },
    select: { id: true },
  });
  if (existingUsers.length !== uniqueMemberIds.length) {
    return { ok: false, error: "One or more selected members were not found." };
  }

  const group = await prisma.memberGroup.create({
    data: {
      name,
      description: input.description?.trim() || null,
      visibility,
      createdById: creatorId,
      members: {
        create: [
          { userId: creatorId, role: "creator" },
          ...uniqueMemberIds.map((userId) => ({ userId, role: "member" })),
        ],
      },
    },
    include: groupInclude,
  });

  return { ok: true, group: mapGroup(group, "creator") };
}

export async function joinPublicGroup(
  groupId: string,
  userId: string,
): Promise<{ ok: true; group: MemberGroupPayload } | { ok: false; error: string }> {
  const group = await prisma.memberGroup.findUnique({
    where: { id: groupId },
    select: { id: true, visibility: true, archivedAt: true, _count: { select: { members: true } } },
  });

  if (!group || group.archivedAt) {
    return { ok: false, error: "Group not found." };
  }
  if (group.visibility !== "public") {
    return { ok: false, error: "This group is private. Ask the owner for an invite." };
  }
  if (group._count.members >= MAX_GROUP_MEMBERS) {
    return { ok: false, error: "This group is full." };
  }
  if (await userInMemberGroup(groupId, userId)) {
    return { ok: false, error: "You are already in this group." };
  }

  await prisma.memberGroupMember.create({
    data: { groupId, userId, role: "member" },
  });

  const updated = await prisma.memberGroup.findUnique({
    where: { id: groupId },
    include: groupInclude,
  });

  if (!updated) return { ok: false, error: "Group not found." };
  return { ok: true, group: mapGroup(updated, "member") };
}

export async function listGroupMembers(
  groupId: string,
  userId: string,
): Promise<{ ok: true; members: GroupMemberPayload[] } | { ok: false; error: string }> {
  const access = await assertActiveGroupMember(groupId, userId);
  if (!access.ok) return access;

  const members = await prisma.memberGroupMember.findMany({
    where: { groupId },
    orderBy: { joinedAt: "asc" },
    include: { user: { select: userSelect } },
  });

  const roleOrder = (role: GroupMemberRole) => {
    if (role === "creator") return 0;
    if (role === "admin") return 1;
    return 2;
  };

  return {
    ok: true,
    members: members
      .map((member) => ({
        userId: member.userId,
        name: member.user.name,
        image: member.user.image,
        siteRole: member.user.role,
        groupRole: parseGroupRole(member.role),
        joinedAt: member.joinedAt.toISOString(),
      }))
      .sort((a, b) => roleOrder(a.groupRole) - roleOrder(b.groupRole)),
  };
}

export async function inviteGroupMembers(
  groupId: string,
  actorId: string,
  memberIds: string[],
): Promise<{ ok: true; added: number } | { ok: false; error: string }> {
  const membership = await getMembership(groupId, actorId);
  if (!membership) return { ok: false, error: "Group not found." };

  const actorRole = parseGroupRole(membership.role);
  if (!canInviteMembers(actorRole)) {
    return { ok: false, error: "Only the creator or admins can invite members." };
  }

  const group = await prisma.memberGroup.findUnique({
    where: { id: groupId },
    select: { archivedAt: true, _count: { select: { members: true } } },
  });
  if (!group || group.archivedAt) return { ok: false, error: "Group not found." };

  const uniqueMemberIds = [...new Set(memberIds.filter((id) => id !== actorId))];
  if (!uniqueMemberIds.length) {
    return { ok: false, error: "Choose at least one member to invite." };
  }

  const existingMembers = await prisma.memberGroupMember.findMany({
    where: { groupId, userId: { in: uniqueMemberIds } },
    select: { userId: true },
  });
  const alreadyMember = new Set(existingMembers.map((entry) => entry.userId));
  const toInvite = uniqueMemberIds.filter((id) => !alreadyMember.has(id));

  if (!toInvite.length) {
    return { ok: false, error: "Everyone selected is already in this group." };
  }

  if (group._count.members + toInvite.length > MAX_GROUP_MEMBERS) {
    return { ok: false, error: `Groups can have up to ${MAX_GROUP_MEMBERS} members.` };
  }

  for (const memberId of toInvite) {
    if (await isBlocked(actorId, memberId)) {
      return { ok: false, error: "One or more selected members cannot be invited." };
    }
  }

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: toInvite } },
    select: { id: true },
  });
  if (existingUsers.length !== toInvite.length) {
    return { ok: false, error: "One or more selected members were not found." };
  }

  await prisma.$transaction(async (tx) => {
    for (const userId of toInvite) {
      await tx.memberGroupMember.create({
        data: { groupId, userId, role: "member" },
      });
    }
    await tx.memberGroup.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    });
  });

  return { ok: true, added: toInvite.length };
}

export async function updateGroupMemberRole(
  groupId: string,
  actorId: string,
  targetUserId: string,
  nextRole: GroupMemberRole,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actorMembership = await getMembership(groupId, actorId);
  if (!actorMembership) return { ok: false, error: "Group not found." };

  if (parseGroupRole(actorMembership.role) !== "creator") {
    return { ok: false, error: "Only the group creator can change admin roles." };
  }

  if (targetUserId === actorId) {
    return { ok: false, error: "The creator role cannot be changed." };
  }

  if (nextRole === "creator") {
    return { ok: false, error: "Transferring creator is not supported yet." };
  }

  if (nextRole !== "admin" && nextRole !== "member") {
    return { ok: false, error: "Invalid group role." };
  }

  const target = await getMembership(groupId, targetUserId);
  if (!target) return { ok: false, error: "Member not found in this group." };
  if (parseGroupRole(target.role) === "creator") {
    return { ok: false, error: "The creator role cannot be changed." };
  }

  await prisma.memberGroupMember.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role: nextRole },
  });

  return { ok: true };
}

export async function removeGroupMember(
  groupId: string,
  actorId: string,
  targetUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actorMembership = await getMembership(groupId, actorId);
  if (!actorMembership) return { ok: false, error: "Group not found." };

  const actorRole = parseGroupRole(actorMembership.role);
  const target = await getMembership(groupId, targetUserId);
  if (!target) return { ok: false, error: "Member not found in this group." };

  const targetRole = parseGroupRole(target.role);
  if (targetRole === "creator") {
    return { ok: false, error: "The group creator cannot be removed." };
  }

  if (actorRole === "member") {
    return { ok: false, error: "You do not have permission to remove members." };
  }

  if (actorRole === "admin") {
    if (targetRole !== "member") {
      return { ok: false, error: "Admins can only remove regular members." };
    }
  }

  if (targetUserId === actorId && actorRole === "creator") {
    return { ok: false, error: "The creator must transfer ownership before leaving." };
  }

  await prisma.memberGroupMember.delete({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });

  return { ok: true };
}

export async function setGroupArchived(
  groupId: string,
  userId: string,
  archived: boolean,
): Promise<{ ok: true; group: MemberGroupPayload } | { ok: false; error: string }> {
  const membership = await getMembership(groupId, userId);
  if (!membership || !canManageArchive(parseGroupRole(membership.role))) {
    return { ok: false, error: "Only the group creator can archive or restore this group." };
  }

  const updated = await prisma.memberGroup.update({
    where: { id: groupId },
    data: { archivedAt: archived ? new Date() : null },
    include: groupInclude,
  });

  return { ok: true, group: mapGroup(updated, "creator") };
}

async function assertActiveGroupMember(groupId: string, userId: string) {
  const group = await prisma.memberGroup.findUnique({
    where: { id: groupId },
    select: { archivedAt: true, members: { where: { userId }, select: { id: true } } },
  });

  if (!group?.members.length) return { ok: false as const, error: "Group not found." };
  if (group.archivedAt) return { ok: false as const, error: "This group is archived." };
  return { ok: true as const };
}

export async function listGroupMessages(
  groupId: string,
  userId: string,
  limit = 50,
): Promise<{ ok: true; messages: GroupMessagePayload[] } | { ok: false; error: string }> {
  const access = await assertActiveGroupMember(groupId, userId);
  if (!access.ok) return access;

  const messages = await prisma.groupMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { sender: { select: userSelect } },
  });

  return { ok: true, messages: messages.reverse().map(serializeGroupMessage) };
}

export async function createGroupMessage(
  groupId: string,
  senderId: string,
  body: string,
): Promise<{ ok: true; message: GroupMessagePayload } | { ok: false; error: string }> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Message cannot be empty." };
  if (trimmed.length > 2000) return { ok: false, error: "Message is too long." };

  const access = await assertActiveGroupMember(groupId, senderId);
  if (!access.ok) return access;

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.groupMessage.create({
      data: {
        groupId,
        senderId,
        body: trimmed,
      },
      include: { sender: { select: userSelect } },
    });

    await tx.memberGroup.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    });

    return created;
  });

  return { ok: true, message: serializeGroupMessage(message) };
}
