/** Shared GROQ fragments — keep queries in one place for Phase 2+ pages. */

const contentCardFields = `
  _id,
  title,
  "slug": slug.current,
  synopsis,
  durationSeconds,
  featured,
  thumbnail,
  publishedAt,
  "creators": creators[]->name
`;

export const HOME_PAGE_QUERY = `{
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0]{
    title,
    tagline,
    homepageHeroTitle,
    homepageHeroSubtitle,
    ageGateText,
    seo
  },
  "featured": *[_type == "content" && featured == true] | order(publishedAt desc)[0] {
    ${contentCardFields}
  },
  "latest": *[_type == "content"] | order(publishedAt desc)[0...16] {
    ${contentCardFields}
  },
  "trending": *[_type == "content"] | order(featured desc, publishedAt desc)[0...12] {
    ${contentCardFields}
  },
  "categories": *[_type == "category"] | order(title asc)[0...12]{
    _id,
    title,
    "slug": slug.current,
    description,
    coverImage
  },
  "creators": *[_type == "creator"] | order(name asc)[0...10]{
    _id,
    name,
    "slug": slug.current,
    avatar
  }
}`;

export const CONTENT_BY_SLUG_QUERY = `*[_type == "content" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  synopsis,
  durationSeconds,
  thumbnail,
  videoUrl,
  "playbackUrl": coalesce(videoUrl, video.asset->url),
  publishedAt,
  featured,
  "creators": creators[]->{ _id, name, "slug": slug.current, avatar },
  "categories": categories[]->{ title, "slug": slug.current },
  "tags": tags[]->{ title, "slug": slug.current },
  seo
}`;

export const EXPLORE_CONTENT_QUERY = `*[_type == "content"] | order(publishedAt desc)[0...48] {
  ${contentCardFields}
}`;
