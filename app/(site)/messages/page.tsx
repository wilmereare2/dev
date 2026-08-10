import type { Metadata } from "next";
import { MessagesHub } from "@/features/chat/messages-hub";
import { requireSession } from "@/lib/auth/guards";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Messages",
  description: `Community chat and private messages on ${APP_NAME}.`,
  robots: { index: false, follow: false },
};

export default async function MessagesPage() {
  const session = await requireSession();
  return <MessagesHub session={session} />;
}
