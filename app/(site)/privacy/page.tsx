import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/legal-page";
import { privacyContent } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: privacyContent.title,
  description: privacyContent.description,
};

export default function PrivacyPage() {
  return <LegalPage {...privacyContent} showContact />;
}
