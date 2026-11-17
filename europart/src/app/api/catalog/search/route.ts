import { connection } from "next/server";
import { handleCatalogSearch } from "@/modules/catalog/http";

export async function GET(request: Request) {
  await connection();
  return handleCatalogSearch(request);
}
