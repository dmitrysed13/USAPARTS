import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { safeStoragePath } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "vin.manage")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const requestRow = await prisma.vinRequest.findUnique({ where: { id } });
  if (!requestRow?.photoKey) return new NextResponse("Нет файла", { status: 404 });
  const ext = requestRow.photoKey.split(".").pop();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const file = await readFile(safeStoragePath(requestRow.photoKey));
  return new NextResponse(new Uint8Array(file), {
    headers: { "Content-Type": mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
