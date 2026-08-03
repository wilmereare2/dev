import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("faq");

export default function FaqPage() {
  return <StubRoutePage slug="faq" />;
}
