import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("terms");

export default function TermsPage() {
  return <StubRoutePage slug="terms" />;
}
