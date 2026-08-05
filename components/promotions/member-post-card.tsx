import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import type { mapPublicMemberPost } from "@/services/creator/uploads";

export type PublicMemberPost = ReturnType<typeof mapPublicMemberPost>;

export function MemberPostCard({ post }: { post: PublicMemberPost }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface/60 shadow-sm transition hover:border-accent/40">
      {post.thumbnailUrl ? (
        <div className="relative aspect-[16/9] bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          {post.isPremium ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <Crown className="size-3.5" />
              Premium
            </span>
          ) : null}
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-accent/20 to-background/40">
          <Sparkles className="size-10 text-accent/70" aria-hidden />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <UserAvatar name={post.creator.name} email={null} image={post.creator.image} size="sm" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold leading-tight">{post.title}</h2>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {post.creator.name ?? "Creator"} · {post.mediaType}
            </p>
          </div>
        </div>

        {post.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.description}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {post.ppvPriceCents != null && post.ppvPriceCents > 0 ? (
            <span className="rounded-full border border-border px-2.5 py-1">
              PPV ${(post.ppvPriceCents / 100).toFixed(2)}
            </span>
          ) : null}
          {(post.categories?.length ?? 0) > 0 ? (
            <span className="rounded-full border border-border px-2.5 py-1">{post.categories?.[0]}</span>
          ) : null}
        </div>

        <Button asChild variant="premium" size="sm" className="mt-auto w-full sm:w-auto">
          <Link href={`/posts/${post.id}`}>View post</Link>
        </Button>
      </div>
    </article>
  );
}
