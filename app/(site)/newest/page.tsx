import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("newest");

export default function NewestPage() {
  return <StubRoutePage slug="newest" />;
}
