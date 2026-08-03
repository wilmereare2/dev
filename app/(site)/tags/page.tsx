import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("tags");

export default function TagsPage() {
  return <StubRoutePage slug="tags" />;
}
