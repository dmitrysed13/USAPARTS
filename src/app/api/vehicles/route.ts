import { NextResponse } from "next/server";
import { enginesFor, getFinderData } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const make = params.get("make");
  const model = params.get("model");
  const year = Number(params.get("year"));
  if (make && model && Number.isInteger(year)) {
    const engines = await enginesFor(make, model, year);
    return NextResponse.json({ engines });
  }
  return NextResponse.json({ makes: await getFinderData() });
}
