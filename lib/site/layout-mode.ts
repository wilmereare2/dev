export type SiteLayoutMode = {
  /** Wider main column (messages, dashboards). */
  wide?: boolean;
  /** Remove horizontal shell padding so pages control their own gutters. */
  flush?: boolean;
  /** Hide marketing footer (chat-style pages). */
  hideFooter?: boolean;
  /** Main column fills remaining viewport height. */
  fillViewport?: boolean;
};

export function resolveSiteLayoutMode(pathname: string): SiteLayoutMode {
  if (pathname.startsWith("/messages")) {
    return { wide: true, flush: true, hideFooter: true, fillViewport: true };
  }

  if (/^\/content\/[^/]+$/.test(pathname)) {
    return { flush: false, fillViewport: false };
  }

  return {};
}
