"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }}
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search content, creators…"
        className="h-11 flex-1 rounded-xl border border-border bg-background/80 px-3 text-sm outline-none focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30"
      />
      <Button type="submit" aria-label="Search">
        <Search className="size-4" />
      </Button>
    </form>
  );
}
