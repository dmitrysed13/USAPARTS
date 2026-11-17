import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { createFxRate, listFxRates } from "@/modules/commerce/fx-rates";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "prices");
  if (!gate.ok) {
    return gate.response;
  }
  const rates = await listFxRates();
  return adminJson({
    rates: rates.map((rate) => ({
      id: rate.id,
      baseCurrency: rate.baseCurrency,
      quoteCurrency: rate.quoteCurrency,
      rate: rate.rate.toString(),
      source: rate.source,
      effectiveFrom: rate.effectiveFrom,
      effectiveTo: rate.effectiveTo,
    })),
  });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "prices");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const row = await createFxRate({
      baseCurrency: String(body.baseCurrency ?? ""),
      quoteCurrency: body.quoteCurrency ? String(body.quoteCurrency) : "BYN",
      rate: Number(body.rate),
      source: String(body.source ?? "manual"),
      effectiveFrom: body.effectiveFrom
        ? new Date(String(body.effectiveFrom))
        : new Date(),
      effectiveTo: body.effectiveTo ? new Date(String(body.effectiveTo)) : null,
    });
    return adminJson({ id: row.id }, 201);
  } catch (error) {
    return fail(request, "/api/admin/fx-rates", publicError(error, "Не сохранено."), 400);
  }
}
