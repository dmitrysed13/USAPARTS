import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/security";
import { suggestProducts } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = await rateLimit(`suggest:${clientIp(request.headers)}`, 60, 60);
  if (!limit.ok) return NextResponse.json({ items: [] }, { status: 429 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const items = await suggestProducts(q);
  return NextResponse.json({ items });
}
