import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/legal-page";
import { termsContent } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: termsContent.title,
  description: termsContent.description,
};

export default function TermsPage() {
  return <LegalPage {...termsContent} showContact />;
}
