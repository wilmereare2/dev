"use client";

import { useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t border-border/60 bg-background/85 px-3 py-2.5 sm:px-4">
      {error ? <p className="mb-2 text-sm text-red-400">{error}</p> : null}
      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 items-end rounded-[22px] border border-border/70 bg-muted/30 px-1 py-1 shadow-inner">
          <label htmlFor={id} className="sr-only">
            Message
          </label>
          <textarea
            ref={textareaRef}
            id={id}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={placeholder}
            maxLength={2000}
            className="max-h-[132px] min-h-[38px] min-w-0 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-0"
          />
        </div>
        <Button
          type="submit"
          variant="premium"
          size="icon"
          className="size-11 shrink-0 rounded-full"
          disabled={pending || !value.trim()}
          aria-label="Send message"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" />}
        </Button>
      </div>
    </form>
  );
}
