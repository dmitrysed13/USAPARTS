import { NextResponse } from "next/server";
import { readCart } from "@/lib/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  const lines = await readCart();
  return NextResponse.json({ count: lines.reduce((sum, line) => sum + line.quantity, 0), lines });
}
