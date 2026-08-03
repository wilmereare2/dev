import { StubRoutePage, stubMetadata } from "@/features/site/stub-route-page";

export const metadata = stubMetadata("categories");

export default function CategoriesPage() {
  return <StubRoutePage slug="categories" />;
}
