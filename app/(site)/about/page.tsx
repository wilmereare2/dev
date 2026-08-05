import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/legal-page";
import { aboutContent } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: aboutContent.title,
  description: aboutContent.description,
};

export default function AboutPage() {
  return <LegalPage {...aboutContent} showContact />;
}
