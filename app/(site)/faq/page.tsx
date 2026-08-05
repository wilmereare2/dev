import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/legal-page";
import { faqContent } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: faqContent.title,
  description: faqContent.description,
};

export default function FaqPage() {
  return <LegalPage {...faqContent} showContact />;
}
