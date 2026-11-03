import { connection } from "next/server";
import { DataUnavailableError } from "@/lib/db/errors";
import { publicSlugSchema } from "@/modules/catalog/slugs";
import { getVehicleBrand } from "@/modules/fitment/repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  await connection();
  const { slug } = await context.params;
  const parsed = publicSlugSchema.safeParse(slug);
  if (!parsed.success) {
    return Response.json(
      { message: "Некорректный адрес марки." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const brand = await getVehicleBrand(parsed.data);
    if (!brand) {
      return Response.json(
        { message: "Марка не найдена." },
        { status: 404, headers: { "cache-control": "no-store" } },
      );
    }
    return Response.json(
      {
        brand: {
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo,
          description: brand.description,
        },
        models: brand.models,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof DataUnavailableError) {
      return Response.json(
        { message: "Список моделей временно недоступен." },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }
    throw error;
  }
}
