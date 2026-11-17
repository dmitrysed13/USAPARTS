import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { listActiveCategories } from "@/modules/catalog/repository";
import { createCategory, vehicleAdminError } from "@/modules/fitment/vehicles";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "categories");
  if (!gate.ok) {
    return gate.response;
  }
  const categories = await listActiveCategories();
  return adminJson({ categories });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "categories");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const category = await createCategory({
      name: body.name,
      slug: body.slug,
      description: body.description,
      parentId: body.parentId,
      sortOrder: body.sortOrder,
    });
    return adminJson({ id: category.id, slug: category.slug }, 201);
  } catch (error) {
    try {
      return fail(request, "/api/admin/categories", vehicleAdminError(error), 400);
    } catch (unknownError) {
      return fail(
        request,
        "/api/admin/categories",
        publicError(unknownError, "Не сохранено."),
        400,
      );
    }
  }
}
