import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { safeStoragePath, storageRoot } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const image = await prisma.productImage.findUnique({ where: { id } });
  if (!image) return new NextResponse("Не найдено", { status: 404 });
  let file: Buffer;
  try {
    file = await readFile(safeStoragePath(image.storageKey));
  } catch {
    return new NextResponse("Файл не найден", { status: 404 });
  }
  const accept = request.headers.get("accept") ?? "";
  if (image.mimeType !== "image/svg+xml" && accept.includes("image/avif")) {
    try {
      const cached = path.join(storageRoot(), "cache", `${image.id}.avif`);
      let avif: Buffer;
      try {
        avif = await readFile(cached);
      } catch {
        const sharp = (await import("sharp")).default;
        avif = await sharp(file).avif({ quality: 50 }).toBuffer();
        await mkdir(path.dirname(cached), { recursive: true });
        await writeFile(cached, avif);
      }
      return new NextResponse(new Uint8Array(avif), {
        headers: { "Content-Type": "image/avif", "Cache-Control": "public, max-age=86400", Vary: "Accept" },
      });
    } catch {
      /* original format remains available */
    }
  }
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=86400",
      Vary: "Accept",
    },
  });
}
