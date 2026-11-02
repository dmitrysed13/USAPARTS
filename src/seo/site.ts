function readEnv(name: string): string {
  const fromVite = import.meta.env?.[name];
  if (typeof fromVite === "string" && fromVite.trim()) return fromVite.trim();
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const fromProcess = proc?.env?.[name];
  if (typeof fromProcess === "string" && fromProcess.trim()) return fromProcess.trim();
  return "";
}

export function siteOrigin(): string {
  return readEnv("VITE_SITE_URL").replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const origin = siteOrigin();
  return origin ? `${origin}${path}` : path;
}

export function publicToken(name: string): string {
  const value = readEnv(name);
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(value)) return "";
  return value;
}
