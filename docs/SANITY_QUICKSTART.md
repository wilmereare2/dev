# Sanity quickstart (manuelaX)

Your **photos and videos only exist after you upload them in Sanity**. The website reads that data; it will look empty until you add content.

## 1. Create a Sanity project (5 minutes)

1. Go to [sanity.io/manage](https://www.sanity.io/manage) and sign in.
2. **Create project** → name it (e.g. `manuelaX`).
3. Copy the **Project ID** (looks like `abc123xy`).

## 2. Connect your app

1. Open `f:\manuelaX\.env`
2. Set:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production
```

3. Restart the dev server (`Ctrl+C`, then `npm run dev`).

## 3. Open Studio

In the browser: **http://localhost:3000/studio**

If you see “not configured”, the project ID is missing or the server wasn’t restarted.

## 4. What to create (in order)

| Step | In Studio | Why |
|------|-----------|-----|
| 1 | **Site settings** (single doc) | Hero title, tagline, age gate text |
| 2 | **Categories** | e.g. “Featured”, “New” — add **cover image** |
| 3 | **Creators** | Name + **avatar** upload |
| 4 | **Content** | Title, **thumbnail**, video file or **External video URL**, pick creators/categories, set **Featured** for hero |

5. Click **Publish** on each document (drafts don’t show on the live site).

## 5. See it on the site

- **Home** → http://localhost:3000 — hero, grids, creators
- **Explore** → http://localhost:3000/explore — full catalog
- Click a card → **/content/your-slug** — watch page

## 6. Tips

- **Featured** checkbox puts a title in the big hero spot.
- **Published at** controls sort order (newest first).
- **Duration (seconds)** shows the time badge on cards.
- Use **External video URL** for CDN links if files are too large for Sanity.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Studio blank / error | Check project ID in `.env`, restart `npm run dev:fresh` |
| **Upload / Select / Clear greyed out** | URL has `perspective=published` — switch top bar to **Draft**, or restart dev after schema update |
| Upload fails | Sanity free tier has limits; use External video URL |
| Home still empty | Publish documents; need at least one **Content** with thumbnail |
| Internal Server Error | Run `npm run dev:fresh` (only one dev server) |
| CORS / API errors | Same project ID and dataset as in Sanity manage |

Need help with a specific step? Tell me what you see on `/studio` (screenshot or error text).
