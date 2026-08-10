export const MEMBER_CHAT_CHANNEL_SLUG = "members-lounge";

export type ChatUserPayload = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
};

export type ChatMessagePayload = {
  id: string;
  body: string;
  createdAt: string;
  user: ChatUserPayload;
};

export type DirectMessagePayload = {
  id: string;
  body: string;
  createdAt: string;
  sender: ChatUserPayload;
};

export type DirectConversationPayload = {
  id: string;
  updatedAt: string;
  peer: ChatUserPayload;
  lastMessage: DirectMessagePayload | null;
  unreadCount: number;
};

export type MemberSummaryPayload = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  known?: boolean;
};

export type GroupMessagePayload = {
  id: string;
  body: string;
  createdAt: string;
  sender: ChatUserPayload;
};

export type MemberGroupPayload = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  memberCount: number;
  createdById: string;
  lastMessage: GroupMessagePayload | null;
};
