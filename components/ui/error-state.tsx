import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center",
        className,
      )}
      role="alert"
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
