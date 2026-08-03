import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("contact");

export default function ContactPage() {
  return <StubRoutePage slug="contact" />;
}
