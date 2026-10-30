import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readCart, writeCart } from "@/lib/cart";
import { placeOrder } from "@/lib/orders";
import { revalidateStore } from "@/server/revalidate-store";
import { rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, clientIp } from "@/lib/security";
import { checkoutSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "origin" }, { status: 403 });
  }
  const limit = await rateLimit(`checkout:${clientIp(request.headers)}`, 10, 600);
  if (!limit.ok) return NextResponse.json({ error: "rate" }, { status: 429 });
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "fields" }, { status: 400 });
  const lines = await readCart();
  if (!lines.length) return NextResponse.json({ error: "empty" }, { status: 400 });
  const session = await auth();
  try {
    const { order, slugs } = await placeOrder({ ...parsed.data, userId: session?.user?.id, items: lines });
    await writeCart([]);
    await revalidateStore(slugs.map((slug) => `/product/${slug}`));
    return NextResponse.json({ ok: true, number: order.number, token: order.accessToken });
  } catch (error) {
    const code = error instanceof Error ? error.message : "save";
    const status = code === "stock" || code === "price" || code === "coupon" || code === "delivery" ? 400 : 500;
    return NextResponse.json({ error: status === 400 ? code : "save" }, { status });
  }
}
