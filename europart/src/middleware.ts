import { NextResponse, type NextRequest } from "next/server";
import { resolveCanonicalRedirect } from "@/lib/security/canonical-host";
import { applySecurityHeaders } from "@/lib/security/headers";

export function middleware(request: NextRequest) {
  const redirect = resolveCanonicalRedirect({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    nodeEnv: process.env.NODE_ENV,
    requestUrl: request.nextUrl,
    forwardedProto: request.headers.get("x-forwarded-proto"),
    forwardedHost: request.headers.get("x-forwarded-host"),
    hostHeader: request.headers.get("host"),
  });

  if (redirect.redirect) {
    const response = NextResponse.redirect(redirect.url, redirect.status);
    applySecurityHeaders(response.headers);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  applySecurityHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
