/**
 * Optional production host / HTTPS redirects driven by NEXT_PUBLIC_SITE_URL.
 * Does not change DNS. Localhost and unset SITE_URL skip redirects.
 */

export type CanonicalRedirect =
  | { redirect: false }
  | { redirect: true; url: URL; status: 308 };

export function resolveCanonicalRedirect(input: {
  siteUrl: string | null | undefined;
  nodeEnv: string | null | undefined;
  requestUrl: URL;
  forwardedProto: string | null;
  forwardedHost: string | null;
  hostHeader: string | null;
}): CanonicalRedirect {
  if (input.nodeEnv !== "production") {
    return { redirect: false };
  }
  const raw = input.siteUrl?.trim();
  if (!raw) {
    return { redirect: false };
  }

  let canonical: URL;
  try {
    canonical = new URL(raw);
  } catch {
    return { redirect: false };
  }

  const canonicalHost = canonical.host.toLowerCase();
  if (
    canonicalHost === "localhost" ||
    canonicalHost.startsWith("127.") ||
    canonicalHost.endsWith(".local")
  ) {
    return { redirect: false };
  }

  const requestHost = (
    input.forwardedHost ??
    input.hostHeader ??
    input.requestUrl.host
  )
    .split(",")[0]
    ?.trim()
    .toLowerCase();

  const proto = (
    input.forwardedProto ??
    input.requestUrl.protocol.replace(":", "")
  )
    .split(",")[0]
    ?.trim()
    .toLowerCase();

  const hostMismatch = Boolean(requestHost && requestHost !== canonicalHost);
  const needsHttps = canonical.protocol === "https:" && proto === "http";

  if (!hostMismatch && !needsHttps) {
    return { redirect: false };
  }

  const target = new URL(input.requestUrl.toString());
  target.protocol = canonical.protocol;
  target.host = canonical.host;
  return { redirect: true, url: target, status: 308 };
}
