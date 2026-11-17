import { connection } from "next/server";
import { DataUnavailableError } from "@/lib/db/errors";
import { listCategoryTree } from "@/modules/catalog/repository";

export async function GET() {
  await connection();
  try {
    const categories = await listCategoryTree();
    return Response.json({ categories }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof DataUnavailableError) {
      return Response.json(
        { message: "Каталог временно недоступен." },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }
    throw error;
  }
}
