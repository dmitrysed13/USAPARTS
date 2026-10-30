import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redisStatus } from "@/lib/cache";
import { deliveryProviderStatus } from "@/lib/integrations/delivery";
import { paymentStatus } from "@/lib/integrations/payments";
import { vinDecoderStatus } from "@/lib/integrations/vin-decoder";

export const dynamic = "force-dynamic";

export async function GET() {
  let db: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }
  const redis = await redisStatus();
  return NextResponse.json({
    ok: db === "up",
    db,
    redis,
    vinDecoder: vinDecoderStatus().status,
    payment: paymentStatus().state,
    delivery: deliveryProviderStatus().state,
  });
}
