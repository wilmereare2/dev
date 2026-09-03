import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  href?: string;
};

export function StatCard({ label, value, hint, href }: StatCardProps) {
  const body = (
    <article className="rounded-2xl border border-border bg-surface/60 p-5 transition hover:border-accent/30">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </article>
  );

  if (href) return <Link href={href}>{body}</Link>;
  return body;
}
