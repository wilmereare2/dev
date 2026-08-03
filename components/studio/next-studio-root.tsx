"use client";

import { useEffect } from "react";
import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

/** Loaded only when Sanity project id is configured. */
export default function NextStudioRoot() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("perspective") === "published") {
      url.searchParams.delete("perspective");
      window.location.replace(url.toString());
    }
  }, []);

  return <NextStudio config={config} />;
}
