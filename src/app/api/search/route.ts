import { NextResponse } from "next/server";
import { listProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const year = Number(params.get("year"));
  const result = await listProducts({
    q: params.get("q") ?? undefined,
    make: params.get("make") ?? undefined,
    model: params.get("model") ?? undefined,
    year: Number.isInteger(year) ? year : undefined,
    engine: params.get("engine") ?? undefined,
    category: params.get("category") ?? undefined,
    page: Number(params.get("page") || 1),
  });
  return NextResponse.json(result);
}
