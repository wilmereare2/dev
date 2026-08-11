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
            Try again. If the problem persists, refresh the page or restart the dev server.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
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
        </div>
      </body>
    </html>
  );
}
