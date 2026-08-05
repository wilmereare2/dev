import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/legal-page";
import { dmcaContent } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: dmcaContent.title,
  description: dmcaContent.description,
};

export default function DmcaPage() {
  return <LegalPage {...dmcaContent} showContact />;
}
