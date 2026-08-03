import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("blog");

export default function BlogPage() {
  return <StubRoutePage slug="blog" />;
}
