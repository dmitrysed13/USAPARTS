type HeaderReader = { get(name: string): string | null };

export function clientIpFromHeaders(headers: HeaderReader): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) {
    return first.slice(0, 64);
  }
  return "unknown";
}
