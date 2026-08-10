import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
