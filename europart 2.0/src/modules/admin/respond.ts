export function wantsHtml(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  return (
    type.includes("application/x-www-form-urlencoded") ||
    type.includes("multipart/form-data")
  );
}

export function adminJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export function adminRedirect(path: string, error?: string): Response {
  const url = new URL(path, "http://admin.local");
  if (error) {
    url.searchParams.set("error", error.slice(0, 300));
  }
  return new Response(null, {
    status: 303,
    headers: { location: `${url.pathname}${url.search}` },
  });
}

export function fail(
  request: Request,
  path: string,
  message: string,
  status: number,
): Response {
  if (wantsHtml(request)) {
    return adminRedirect(path, message);
  }
  return adminJson({ message }, status);
}

export function formText(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function publicError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
