import { CreatorUploadForm } from "@/features/dashboard/creator-upload-form";
import { DEFAULT_UPLOAD_CATEGORIES } from "@/lib/creator/guidelines";
import { fetchCategoriesIndex } from "@/services/sanity/catalog";

export default async function CreatorUploadPage() {
  const sanityCategories = await fetchCategoriesIndex();
  const categories =
    sanityCategories.length > 0
      ? sanityCategories.map((cat) => ({ slug: cat.slug, title: cat.title }))
      : DEFAULT_UPLOAD_CATEGORIES.map((cat) => ({ slug: cat.slug, title: cat.title }));

  return <CreatorUploadForm categories={categories} />;
}
