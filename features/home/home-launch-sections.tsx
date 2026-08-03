import Link from "next/link";
import { Bell, Clapperboard, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const VALUE_PROPS = [
  {
    icon: Clapperboard,
    title: "Cinematic quality",
    body: "Premium playback, rich thumbnails, and a layout built for video-first discovery.",
  },
  {
    icon: Users,
    title: "Creator-led catalog",
    body: "Every profile and release is curated — discover exclusive creators as they join.",
  },
  {
    icon: Sparkles,
    title: "New every week",
    body: "Fresh uploads, trending picks, and featured spotlights as the library grows.",
  },
] as const;

export function HomeLaunchSections() {
  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Platform introduction */}
      <section aria-labelledby="intro-heading">
        <h2 id="intro-heading" className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Built for premium discovery
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          manuelaX is launching with a hand-picked roster of creators. Browse by category, follow
          profiles, and watch exclusive releases — all in one elegant experience.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-accent/30 hover:shadow-md"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured creators — coming soon */}
      <section aria-labelledby="creators-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Coming soon</p>
            <h2 id="creators-heading" className="mt-1 font-display text-xl font-semibold sm:text-2xl">
              Featured creators
            </h2>
          </div>
          <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            New creators joining every week
          </span>
        </div>
        <div className="mt-5 flex gap-4 overflow-x-auto pb-1">
          {["Creator spotlights", "Verified profiles", "Exclusive drops"].map((label, i) => (
            <div
              key={label}
              className="flex w-[120px] shrink-0 flex-col items-center gap-2 sm:w-[132px]"
            >
              <div className="relative size-20 overflow-hidden rounded-full border-2 border-dashed border-border bg-gradient-to-br from-accent/15 to-muted sm:size-[88px]">
                <div className="flex size-full items-center justify-center text-lg font-semibold text-accent/50">
                  {String.fromCharCode(65 + i)}
                </div>
              </div>
              <span className="text-center text-xs font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Latest updates + newsletter + creator apply */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Latest updates</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              Premium creator content coming soon — library opens in phases.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              Categories, trending, and creator profiles roll out as uploads go live.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              Follow us for launch announcements and featured spotlights.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 text-accent">
            <Bell className="size-4" aria-hidden />
            <h2 className="font-display text-lg font-semibold text-foreground">Get notified at launch</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Be the first to know when new creators and exclusive releases go live.
          </p>
          <form className="mt-4 flex flex-col gap-2 sm:flex-row" action="/contact">
            <input
              type="email"
              name="email"
              placeholder="you@email.com"
              aria-label="Email for launch notifications"
              className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-accent/30 focus:ring-2"
            />
            <Button type="submit" className="shrink-0">
              Notify me
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Prefer to create?{" "}
            <Link href="/contact" className="font-medium text-accent hover:underline">
              Apply as a creator
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
