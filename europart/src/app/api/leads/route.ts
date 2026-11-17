import { connection } from "next/server";
import { clientIpFromHeaders } from "@/lib/http/client-ip";
import { createLead } from "@/modules/commerce/leads";

export async function POST(request: Request) {
  await connection();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const lead = await createLead({
      type:
        body.type === "RARE_PART" ||
        body.type === "B2B" ||
        body.type === "CONTACT" ||
        body.type === "PRICE_REQUEST"
          ? body.type
          : "PRICE_REQUEST",
      name: String(body.name ?? ""),
      phone: body.phone ? String(body.phone) : undefined,
      email: body.email ? String(body.email) : "",
      message: body.message ? String(body.message) : undefined,
      productId: body.productId ? String(body.productId) : undefined,
      vin: body.vin ? String(body.vin) : undefined,
      article: body.article ? String(body.article) : undefined,
      ip: clientIpFromHeaders(request.headers),
    });
    return Response.json(
      { id: lead.id, status: lead.status },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Заявка не сохранена.";
    return Response.json(
      { message },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
}
