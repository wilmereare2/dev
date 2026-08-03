import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("trending");

export default function TrendingPage() {
  return <StubRoutePage slug="trending" />;
}
