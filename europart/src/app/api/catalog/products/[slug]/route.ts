import { connection } from "next/server";
import { handlePublishedProduct } from "@/modules/catalog/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  await connection();
  const { slug } = await context.params;
  return handlePublishedProduct(slug);
}
