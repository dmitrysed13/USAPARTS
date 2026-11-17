import { headers } from "next/headers";
import { applyStorefrontRedirect } from "@/modules/seo/redirect-resolve";

/** Request-time 301s from RedirectRule + /parts → /product. */
export async function StorefrontRedirectGate() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (!pathname) {
    return null;
  }
  await applyStorefrontRedirect(pathname);
  return null;
}
