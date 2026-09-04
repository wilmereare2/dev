/**
 * Client-side fetch helpers that never throw.
 *
 * A bare `await response.json()` rejects whenever the server replies with a
 * non-JSON body — a proxy 413 for an oversized upload, a 502 HTML error page,
 * or a dropped connection. When that rejection happens inside a submit handler
 * without a `finally`, the pending flag is never cleared and the button stays
 * stuck on "Saving…" forever. These helpers turn every failure into a value.
 */

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; data?: undefined };

const NETWORK_ERROR = "Network error. Check your connection and try again.";

function messageForStatus(status: number, fallback?: string) {
  if (fallback) return fallback;
  switch (status) {
    case 401:
      return "Your session expired. Sign in again to continue.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "Not found.";
    case 409:
      return "That conflicts with existing data.";
    case 413:
      return "That upload is too large. Use a smaller file.";
    case 429:
      return "Too many requests. Wait a moment and try again.";
    case 504:
    case 408:
      return "The server took too long to respond. Try again.";
    default:
      return status >= 500 ? "Something went wrong on the server. Try again." : "Request failed.";
  }
}

/** Reads a response body as JSON without ever throwing. */
async function readJson(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => "");
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function extractError(payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
    if (typeof record.message === "string" && record.message.trim()) return record.message;
  }
  return undefined;
}

export type RequestJsonInit = Omit<RequestInit, "body"> & {
  /** Plain object bodies are JSON-encoded; FormData/string are passed through. */
  body?: unknown;
  /** Abort the request after this many ms so the UI cannot hang indefinitely. */
  timeoutMs?: number;
};

/**
 * Performs a request and always resolves to an `ApiResult`. Never rejects, so
 * callers can clear pending state on every path.
 */
export async function requestJson<T = unknown>(
  url: string,
  init: RequestJsonInit = {},
): Promise<ApiResult<T>> {
  const { body, timeoutMs = 30_000, headers, ...rest } = init;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isPlainBody = body !== undefined && !isFormData && typeof body !== "string";

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer =
    controller && timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const response = await fetch(url, {
      ...rest,
      signal: rest.signal ?? controller?.signal,
      headers: {
        ...(isPlainBody ? { "Content-Type": "application/json" } : {}),
        ...(headers as Record<string, string> | undefined),
      },
      body: isPlainBody ? JSON.stringify(body) : (body as BodyInit | undefined),
    });

    const payload = await readJson(response);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: messageForStatus(response.status, extractError(payload)),
      };
    }

    return { ok: true, status: response.status, data: (payload ?? null) as T };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, status: 0, error: "The request timed out. Try again." };
    }
    return { ok: false, status: 0, error: NETWORK_ERROR };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** GET helper for read-only loads. */
export function getJson<T = unknown>(url: string, init: RequestJsonInit = {}) {
  return requestJson<T>(url, { ...init, method: "GET" });
}
