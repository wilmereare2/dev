import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("popular");

export default function PopularPage() {
  return <StubRoutePage slug="popular" />;
}
