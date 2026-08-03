import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("about");

export default function AboutPage() {
  return <StubRoutePage slug="about" />;
}
