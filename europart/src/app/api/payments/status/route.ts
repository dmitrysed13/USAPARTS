import { connection } from "next/server";
import { getPublicPaymentAvailability } from "@/modules/commerce/payment/service";

export async function GET() {
  await connection();
  const payment = await getPublicPaymentAvailability();
  return Response.json(
    { payment },
    { headers: { "cache-control": "no-store" } },
  );
}
