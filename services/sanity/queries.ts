/** Shared GROQ fragments — keep queries in one place for Phase 2+ pages. */

const contentCardFields = `
  _id,
  title,
  "slug": slug.current,
  synopsis,
  durationSeconds,
  featured,
  isPremium,
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
  },
  "stats": {
    "videoCount": count(*[_type == "content"]),
    "creatorCount": count(*[_type == "creator"]),
    "categoryCount": count(*[_type == "category"])
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
  "isPremium": coalesce(isPremium, false),
  "streamAssetId": streamAssetId,
  seo
}`;

export const EXPLORE_CONTENT_QUERY = `*[_type == "content"] | order(publishedAt desc)[0...48] {
  ${contentCardFields}
}`;

export const NEWEST_CONTENT_QUERY = `*[_type == "content"] | order(publishedAt desc)[0...48] {
  ${contentCardFields}
}`;

export const POPULAR_CONTENT_QUERY = `*[_type == "content"] | order(featured desc, publishedAt desc)[0...48] {
  ${contentCardFields}
}`;

export const TRENDING_CONTENT_QUERY = `*[_type == "content"] | order(featured desc, publishedAt desc)[0...24] {
  ${contentCardFields}
}`;

export const SEARCH_CONTENT_QUERY = `*[_type == "content" && (
  title match $term + "*" ||
  synopsis match $term + "*" ||
  count(creators[]->name[match $term + "*"]) > 0
)] | order(publishedAt desc)[0...48] {
  ${contentCardFields}
}`;

export const CATEGORIES_INDEX_QUERY = `*[_type == "category"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  coverImage
}`;

export const TAGS_INDEX_QUERY = `*[_type == "tag"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description
}`;

export const CONTENT_BY_IDS_QUERY = `*[_type == "content" && _id in $ids] {
  ${contentCardFields}
}`;
