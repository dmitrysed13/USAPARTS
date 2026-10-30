import { moderateReviewAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function ReviewsAdmin() {
  await requirePermission("reviews.moderate");
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" }, include: { product: true } });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Отзывы</h1>
      <div className="mt-4 space-y-3">
        {reviews.map((review) => (
          <article key={review.id} className="card p-4 text-sm">
            <p className="font-semibold">{review.authorName} · {review.rating}/5 · {review.status} {review.isDemo ? "· тестовый" : ""}</p>
            <p className="mt-1">{review.body}</p>
            <form action={moderateReviewAction} className="mt-2 flex gap-2">
              <input type="hidden" name="id" value={review.id} />
              <select name="status" defaultValue={review.status} className="field max-w-xs">
                <option value="PENDING">На модерации</option>
                <option value="PUBLISHED">Опубликован</option>
                <option value="REJECTED">Отклонён</option>
              </select>
              <button className="btn-ghost">Сохранить</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
