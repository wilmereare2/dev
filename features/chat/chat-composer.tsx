"use client";

import { useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

type ChatComposerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  error: string | null;
  placeholder: string;
};

const MAX_HEIGHT_PX = 132;

export function ChatComposer({
  id,
  value,
  onChange,
  onSubmit,
  pending,
  error,
  placeholder,
}: ChatComposerProps) {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !pending;

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  return (
    <div className="shrink-0 border-t border-border/60 bg-background/90 px-3 py-3 sm:px-4">
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-3xl">
        {error ? (
          <p role="alert" className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <div className="flex min-w-0 flex-1 items-end rounded-2xl border border-border/70 bg-muted/25 px-1 py-1 shadow-inner transition focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/15">
            <label htmlFor={id} className="sr-only">
              Message
            </label>
            <textarea
              ref={textareaRef}
              id={id}
              rows={1}
              value={value}
              disabled={pending}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (canSend) event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={placeholder}
              maxLength={2000}
              className="max-h-[132px] min-h-[40px] min-w-0 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm leading-relaxed outline-none"
            />
          </div>
          <Button
            type="submit"
            variant="premium"
            size="icon"
            className={cn(
              "size-11 shrink-0 rounded-full transition",
              canSend ? "opacity-100" : "opacity-50",
            )}
            disabled={!canSend}
            aria-label={pending ? "Sending message" : "Send message"}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" />}
          </Button>
        </div>
        <p className="mt-2 hidden text-[11px] text-muted-foreground sm:block">
          {t("chat.enterToSend")}
        </p>
      </form>
    </div>
  );
}
