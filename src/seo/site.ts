import { resolveSiteOrigin } from "./origin.ts";

function readEnv(name: string): string {
  const fromVite = import.meta.env?.[name];
  if (typeof fromVite === "string" && fromVite.trim()) return fromVite.trim();
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const fromProcess = proc?.env?.[name];
  if (typeof fromProcess === "string" && fromProcess.trim()) return fromProcess.trim();
  return "";
}

function isProduction(): boolean {
  if (typeof import.meta.env?.PROD === "boolean") return import.meta.env.PROD;
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.NODE_ENV === "production";
}

export function siteOrigin(): string {
  return resolveSiteOrigin(readEnv("VITE_SITE_URL"), isProduction());
}

export function absoluteUrl(path: string): string {
  return `${siteOrigin()}${path}`;
}

export function publicToken(name: string): string {
  const value = readEnv(name);
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(value)) return "";
  return value;
}
