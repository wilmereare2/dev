import { NextResponse } from "next/server";
import { DEFAULT_UPLOAD_CATEGORIES } from "@/lib/creator/guidelines";
import { fetchCategoriesIndex } from "@/services/sanity/catalog";

export async function GET() {
  const sanityCategories = await fetchCategoriesIndex();

  const categories =
    sanityCategories.length > 0
      ? sanityCategories.map((cat) => ({
          id: cat._id,
          slug: cat.slug,
          title: cat.title,
          description: cat.description ?? null,
        }))
      : DEFAULT_UPLOAD_CATEGORIES.map((cat) => ({
          id: cat.slug,
          slug: cat.slug,
          title: cat.title,
          description: null,
        }));

  return NextResponse.json({ categories });
}
