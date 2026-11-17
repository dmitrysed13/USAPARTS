import { DataUnavailableError } from "@/lib/db/errors";
import { clientIpFromHeaders } from "@/lib/http/client-ip";
import { searchRateLimit } from "@/lib/security/rate-limit";
import {
  getPublishedProduct,
  searchPublishedProducts,
} from "@/modules/catalog/repository";
import { parseSearchQuery } from "@/modules/catalog/search-params";
import { publicSlugSchema } from "@/modules/catalog/slugs";

const noStore = { "cache-control": "no-store" };

export async function handleCatalogSearch(request: Request): Promise<Response> {
  const limit = searchRateLimit.consume(clientIpFromHeaders(request.headers));
  if (!limit.ok) {
    return Response.json(
      { message: "Слишком много запросов. Повторите чуть позже." },
      {
        status: 429,
        headers: { "retry-after": String(limit.retryAfterSeconds), ...noStore },
      },
    );
  }

  const url = new URL(request.url);
  const parsed = parseSearchQuery({
    q: url.searchParams.get("q"),
    page: url.searchParams.get("page"),
    pageSize: url.searchParams.get("pageSize"),
  });
  if (!parsed.ok) {
    return Response.json({ message: parsed.message }, { status: 400, headers: noStore });
  }

  try {
    const result = await searchPublishedProducts(parsed.query);
    return Response.json(result, { headers: noStore });
  } catch (error) {
    if (error instanceof DataUnavailableError) {
      return Response.json(
        { message: "Поиск временно недоступен." },
        { status: 503, headers: noStore },
      );
    }
    throw error;
  }
}

export async function handlePublishedProduct(slug: string): Promise<Response> {
  const parsed = publicSlugSchema.safeParse(slug);
  if (!parsed.success) {
    return Response.json(
      { message: "Некорректный адрес товара." },
      { status: 400, headers: noStore },
    );
  }

  try {
    const product = await getPublishedProduct(parsed.data);
    if (!product) {
      return Response.json(
        { message: "Товар не найден." },
        { status: 404, headers: noStore },
      );
    }
    return Response.json({ product }, { headers: noStore });
  } catch (error) {
    if (error instanceof DataUnavailableError) {
      return Response.json(
        { message: "Карточка временно недоступна." },
        { status: 503, headers: noStore },
      );
    }
    throw error;
  }
}
