import Link from "next/link";
import { connection } from "next/server";
import { buttonClassName } from "@/components/ui/button";
import { getPrismaClient } from "@/lib/db/prisma";

export default async function AdminHomePage() {
  await connection();
  const prisma = getPrismaClient();
  const [suppliers, products, drafts, jobs] = await Promise.all([
    prisma.supplier.count(),
    prisma.product.count(),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.importJob.count(),
  ]);
  const cards = [
    { label: "Поставщики", value: suppliers, href: "/admin/suppliers" },
    { label: "Товары", value: products, href: "/admin/products" },
    { label: "Черновики", value: drafts, href: "/admin/products" },
    { label: "Импорты", value: jobs, href: "/admin/imports/new" },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Ассортимент</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            Прайс сначала показывает предпросмотр. Новые карточки из файла остаются
            черновиками и не появляются в каталоге, пока их отдельно не опубликуют.
          </p>
        </div>
        <Link className={buttonClassName()} href="/admin/imports/new">
          Загрузить прайс
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label}>
            <Link
              className="block rounded-2xl border border-line bg-surface p-4"
              href={card.href}
            >
              <span className="text-sm text-ink-muted">{card.label}</span>
              <span className="mt-2 block font-display text-3xl font-semibold">
                {card.value}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
