import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { PageSkeleton } from "@/components/catalog/page-skeleton";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/state";
import { buttonClassName } from "@/components/ui/button";
import { closedMetadata } from "@/lib/seo/closed";
import {
  CART_COOKIE,
  decodeCart,
  resolveCartSecret,
} from "@/modules/commerce/cart-cookie";
import { resolveCartLines } from "@/modules/commerce/cart-service";

export const metadata: Metadata = closedMetadata({
  title: "Корзина",
  description: "Корзина EUROPART. Цены и наличие пересчитываются по актуальным предложениям.",
  canonical: "/cart",
});

async function CartContent() {
  await connection();
  const secret = resolveCartSecret();
  if (!secret) {
    return (
      <EmptyState
        description="Задайте CART_SECRET (от 16 символов) в окружении сервера. Без секрета корзина не подписывается."
        title="Корзина недоступна"
      />
    );
  }
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  const lines = decodeCart(raw, secret);
  const cart = await resolveCartLines(lines);

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        description="Добавьте товар с розничной ценой из каталога. Демонстрационных позиций нет."
        title="Корзина пуста"
      />
    );
  }

  return (
    <div className="grid gap-4">
      <ul className="divide-y divide-line border border-line">
        {cart.lines.map((line) => (
          <li
            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            key={line.offerId}
          >
            <div>
              {line.productSlug ? (
                <Link
                  className="font-medium hover:text-brand"
                  href={`/product/${line.productSlug}`}
                >
                  {line.name}
                </Link>
              ) : (
                <span className="font-medium">{line.name}</span>
              )}
              <p className="text-sm text-ink-muted">
                {line.quantity} шт.
                {line.unitPriceCents != null
                  ? ` · ${(line.unitPriceCents / 100).toFixed(2)} BYN`
                  : null}
              </p>
              {line.issue ? <p className="text-sm text-danger">{line.issue}</p> : null}
            </div>
          </li>
        ))}
      </ul>
      {cart.issues.length > 0 ? (
        <p className="text-sm text-danger">{cart.issues.join(" ")}</p>
      ) : null}
      <p className="text-lg font-semibold">
        {cart.subtotalCents != null
          ? `Итого: ${(cart.subtotalCents / 100).toFixed(2)} BYN`
          : "Итого уточнит менеджер — не все позиции готовы к оформлению."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link className={buttonClassName("primary")} href="/checkout">
          Оформить заказ
        </Link>
        <Link className={buttonClassName("secondary")} href="/catalog">
          В каталог
        </Link>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Container className="grid gap-8 py-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Корзина</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Количество можно менять через API. Перед оформлением цены и актуальность
          предложений проверяются снова.
        </p>
      </div>
      <Suspense fallback={<PageSkeleton />}>
        <CartContent />
      </Suspense>
    </Container>
  );
}
