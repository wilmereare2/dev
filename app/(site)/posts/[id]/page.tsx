import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import { getPublicMemberPost } from "@/services/creator/uploads";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicMemberPost(id);
  if (!post) return { title: "Member post" };
  return { title: post.title, description: post.description ?? undefined };
}

export default async function MemberPostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPublicMemberPost(id);
  if (!post) notFound();

  const imageSrc = post.thumbnailUrl ?? (post.mediaType === "photo" ? post.mediaUrl : null);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <UserAvatar name={post.creator.name} email={null} image={post.creator.image} size="md" />
        <div>
          <p className="text-sm text-muted-foreground">Member post</p>
          <p className="font-medium">{post.creator.name ?? "Creator"}</p>
        </div>
      </div>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-border px-2.5 py-1 capitalize">{post.mediaType}</span>
        {post.isPremium ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-accent">
            <Crown className="size-3.5" />
            Premium
          </span>
        ) : null}
        {post.ppvPriceCents != null && post.ppvPriceCents > 0 ? (
          <span className="rounded-full border border-border px-2.5 py-1">
            PPV ${(post.ppvPriceCents / 100).toFixed(2)}
          </span>
        ) : null}
      </div>

      {post.description ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{post.description}</p> : null}

      {imageSrc ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-surface/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt="" className="max-h-[720px] w-full object-contain" />
        </div>
      ) : null}

      {post.mediaUrl && post.mediaType === "video" ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-surface/40 p-4">
          <video controls className="w-full rounded-xl" src={post.mediaUrl} />
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {post.creator.slug ? (
          <Button asChild variant="secondary">
            <Link href={`/creator/${post.creator.slug}`}>View creator profile</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/promotions">Back to promotions</Link>
        </Button>
      </div>
    </section>
  );
}
