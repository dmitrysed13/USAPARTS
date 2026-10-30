import { createHash } from "crypto";
import path from "path";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return;
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new Error("Некорректный источник запроса.");
  }
  if (originHost !== host) throw new Error("Запрос отклонён.");
}

export function clientIp(headerStore: Headers) {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 64);
  return headerStore.get("x-real-ip")?.slice(0, 64) ?? "local";
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function detectImage(bytes: Uint8Array, reportedType: string) {
  if (bytes.length < 12 || bytes.length > 5_000_000) return null;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  const mime = jpeg ? "image/jpeg" : png ? "image/png" : webp ? "image/webp" : null;
  if (!mime || !ALLOWED.has(mime)) return null;
  if (reportedType && reportedType !== "application/octet-stream" && !ALLOWED.has(reportedType)) return null;
  return mime;
}

export function storageRoot() {
  return path.resolve(process.cwd(), "storage");
}

export function safeStoragePath(key: string) {
  if (!/^[a-zA-Z0-9/_-]+\.(svg|webp|jpe?g|png)$/.test(key)) {
    throw new Error("Недопустимое имя файла.");
  }
  const root = storageRoot();
  const full = path.resolve(root, key);
  if (full !== root && !full.startsWith(root + path.sep)) throw new Error("Недопустимый путь.");
  return full;
}

export function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}
