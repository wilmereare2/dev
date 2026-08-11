"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  function clearSiteData() {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("manuelax") || key === "theme") {
          localStorage.removeItem(key);
        }
      }
    } catch {
      /* ignore */
    }
    window.location.href = "/account";
  }

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#030305",
          color: "#fff8fa",
        }}
      >
        <div style={{ maxWidth: "28rem", padding: "1.5rem", textAlign: "center" }}>
          <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.75rem", opacity: 0.8 }}>
            Error
          </p>
          <h1 style={{ fontSize: "2rem", fontWeight: 600, marginTop: "1rem" }}>Something went wrong</h1>
          <p style={{ marginTop: "1rem", fontSize: "0.875rem", opacity: 0.75 }}>
            {process.env.NODE_ENV === "development"
              ? "Try again. If the problem persists, refresh the page or restart the dev server."
              : "Try again in a moment. If this keeps happening, clear site cookies for manuelax.com and reload."}
          </p>
          {error.digest ? (
            <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", opacity: 0.55 }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#e11d48",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/verify-age";
              }}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Age verification
            </button>
            <button
              type="button"
              onClick={clearSiteData}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Clear saved data
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
