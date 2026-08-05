import type { Metadata } from "next";
import { MemberChatRoom } from "@/features/chat/member-chat-room";
import { requireSession } from "@/lib/auth/guards";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Member chat",
  description: `Real-time member lounge on ${APP_NAME}.`,
  robots: { index: false, follow: false },
};

export default async function MessagesPage() {
  const session = await requireSession();
  return <MemberChatRoom session={session} />;
}
