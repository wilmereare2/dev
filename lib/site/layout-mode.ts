export type SiteLayoutMode = {
  /** Wider main column (messages, dashboards). */
  wide?: boolean;
  /** Use full viewport width for the shell (gallery / discovery pages). */
  fullWidth?: boolean;
  /** Remove horizontal shell padding so pages control their own gutters. */
  flush?: boolean;
  /** Hide marketing footer (chat-style pages). */
  hideFooter?: boolean;
  /** Main column fills remaining viewport height. */
  fillViewport?: boolean;
};

const GALLERY_PREFIXES = [
  "/explore",
  "/promotions",
  "/trending",
  "/popular",
  "/newest",
  "/search",
  "/categories",
  "/tags",
  "/library",
];

function isGalleryDiscoveryPath(pathname: string) {
  return GALLERY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveSiteLayoutMode(pathname: string): SiteLayoutMode {
  if (pathname.startsWith("/messages")) {
    return { wide: true, flush: true, hideFooter: true, fillViewport: true };
  }

  if (pathname === "/") {
    return { fullWidth: true, flush: true };
  }

  if (/^\/content\/[^/]+$/.test(pathname)) {
    return { flush: false, fillViewport: false };
  }

  if (isGalleryDiscoveryPath(pathname)) {
    return { fullWidth: true, flush: true };
  }

  return {};
}
