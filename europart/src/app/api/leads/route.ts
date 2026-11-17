import { connection } from "next/server";
import { ATTR_FIRST_COOKIE, ATTR_LAST_COOKIE } from "@/modules/analytics/attribution";
import { clientIpFromHeaders } from "@/lib/http/client-ip";
import { createLead } from "@/modules/commerce/leads";

function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  if (!match) {
    return null;
  }
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

export async function POST(request: Request) {
  await connection();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const attribution =
      body.attribution && typeof body.attribution === "object"
        ? (body.attribution as Record<string, unknown>)
        : undefined;
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
      attribution: attribution
        ? {
            utmSource: attribution.utmSource ? String(attribution.utmSource) : null,
            utmMedium: attribution.utmMedium ? String(attribution.utmMedium) : null,
            utmCampaign: attribution.utmCampaign
              ? String(attribution.utmCampaign)
              : null,
            utmContent: attribution.utmContent ? String(attribution.utmContent) : null,
            utmTerm: attribution.utmTerm ? String(attribution.utmTerm) : null,
            firstTouchSource: attribution.firstTouchSource
              ? String(attribution.firstTouchSource)
              : null,
            lastTouchSource: attribution.lastTouchSource
              ? String(attribution.lastTouchSource)
              : null,
          }
        : undefined,
      attributionCookies: {
        first: cookieValue(request, ATTR_FIRST_COOKIE),
        last: cookieValue(request, ATTR_LAST_COOKIE),
      },
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
