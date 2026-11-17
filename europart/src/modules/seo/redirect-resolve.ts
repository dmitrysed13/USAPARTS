import "server-only";

import { permanentRedirect } from "next/navigation";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { normalizePublicPath, pathsEqual } from "@/modules/seo/paths";

export async function findActiveRedirect(pathname: string) {
  const fromPath = normalizePublicPath(pathname);
  return withDatabase(() =>
    getPrismaClient().redirectRule.findFirst({
      where: {
        isActive: true,
        OR: [{ fromPath }, { fromPath: `${fromPath}/` }],
      },
    }),
  );
}

/** Apply DB redirect or /parts → /product alias. */
export async function applyStorefrontRedirect(pathname: string): Promise<void> {
  const normalized = normalizePublicPath(pathname);
  if (
    normalized.startsWith("/admin") ||
    normalized.startsWith("/api") ||
    normalized.startsWith("/_next")
  ) {
    return;
  }

  const partsMatch = /^\/parts\/([^/]+)$/.exec(normalized);
  if (partsMatch?.[1]) {
    permanentRedirect(`/product/${decodeURIComponent(partsMatch[1])}`);
  }

  try {
    const rule = await findActiveRedirect(normalized);
    if (rule && !pathsEqual(rule.fromPath, rule.toPath)) {
      permanentRedirect(normalizePublicPath(rule.toPath));
    }
  } catch {
    // DB unavailable — skip redirects rather than break the storefront.
  }
}
