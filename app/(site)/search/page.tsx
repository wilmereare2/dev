import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("search");

export default function SearchPage() {
  return <StubRoutePage slug="search" />;
}
