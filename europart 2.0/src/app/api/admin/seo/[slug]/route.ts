import { connection } from "next/server";
import { isLandingSlug } from "@/modules/seo/landings";
import { resetLandingContent, saveLandingContent } from "@/modules/admin/landing-content";
import { requireAdminApi } from "@/modules/admin/guard";
import { fail, formText, wantsHtml } from "@/modules/admin/respond";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  const { slug } = await context.params;
  const back = `/admin/seo/${slug}`;
  if (!isLandingSlug(slug)) {
    return fail(request, "/admin/seo", "Такой посадочной нет.", 404);
  }
  try {
    const form = await request.formData();
    if (formText(form, "action") === "reset") {
      await resetLandingContent(slug);
    } else {
      await saveLandingContent(slug, form);
    }
    if (wantsHtml(request)) {
      return new Response(null, { status: 303, headers: { location: back } });
    }
    return Response.json({ slug }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Страница не сохранена.";
    return fail(request, back, message, 400);
  }
}
