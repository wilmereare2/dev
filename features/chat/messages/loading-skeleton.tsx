import { cn } from "@/lib/utils";

export function ConversationListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="animate-pulse px-2 py-2" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="flex items-center gap-3 rounded-xl px-2 py-3">
          <div className="size-10 shrink-0 rounded-full bg-muted/60" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-muted/60" />
            <div className="h-2.5 w-4/5 rounded bg-muted/40" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ChatMessagesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 px-2 py-3 animate-pulse" aria-hidden>
      <div className="flex justify-center">
        <div className="h-6 w-24 rounded-full bg-black/30" />
      </div>
      <div className="flex gap-2.5">
        <div className="size-8 rounded-full bg-[#182533]/80" />
        <div className="h-14 w-2/5 rounded-xl rounded-tl-sm bg-[#182533]/70" />
      </div>
      <div className="flex flex-row-reverse">
        <div className="h-10 w-1/3 rounded-xl rounded-br-sm bg-accent/25" />
      </div>
      <div className="flex gap-2.5">
        <div className="size-8 rounded-full bg-[#182533]/80" />
        <div className="h-16 w-3/5 rounded-xl rounded-tl-sm bg-[#182533]/70" />
      </div>
    </div>
  );
}

export function InlineErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-10 text-center", className)}>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-sm font-medium transition hover:border-accent/40 hover:bg-muted/40"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
