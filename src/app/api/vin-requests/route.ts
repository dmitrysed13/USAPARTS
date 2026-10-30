import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decodeVin } from "@/lib/integrations/vin-decoder";
import { rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, clientIp } from "@/lib/security";
import { validateVin } from "@/lib/vin";
import { vinRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "origin" }, { status: 403 });
  }
  const limit = await rateLimit(`vin:${clientIp(request.headers)}`, 8, 600);
  if (!limit.ok) return NextResponse.json({ error: "rate" }, { status: 429 });
  const body = await request.json().catch(() => null);
  const parsed = vinRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "fields" }, { status: 400 });
  if (parsed.data.company) return NextResponse.json({ ok: true, stored: false });
  const vin = validateVin(parsed.data.vin);
  const year = parsed.data.year ? Number(parsed.data.year) : undefined;
  const decoder = vin.ok ? await decodeVin(vin.vin) : { status: "not_connected" as const };
  const row = await prisma.vinRequest.create({
    data: {
      vin: vin.vin,
      vinValid: vin.ok,
      makeName: parsed.data.makeName || null,
      modelName: parsed.data.modelName || null,
      year: year && Number.isInteger(year) ? year : null,
      partDescription: parsed.data.partDescription,
      phone: parsed.data.phone,
      email: parsed.data.email.toLowerCase(),
      decoderStatus: decoder.status,
      decoderPayload: decoder.status === "ok" ? (decoder.raw as object) : undefined,
    },
    select: { id: true, vinValid: true, decoderStatus: true },
  });
  return NextResponse.json({ ok: true, stored: true, ...row });
}
