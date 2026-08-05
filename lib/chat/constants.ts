export const MEMBER_CHAT_CHANNEL_SLUG = "members-lounge";

export type ChatMessagePayload = {
  id: string;
  body: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
};
