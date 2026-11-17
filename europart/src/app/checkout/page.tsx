import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { PageSkeleton } from "@/components/catalog/page-skeleton";
import { CheckoutForm } from "@/components/commerce/checkout-form";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/state";
import { closedMetadata } from "@/lib/seo/closed";
import {
  CART_COOKIE,
  decodeCart,
  resolveCartSecret,
} from "@/modules/commerce/cart-cookie";
import { resolveCartLines } from "@/modules/commerce/cart-service";
import {
  listActiveDeliveryMethods,
  quoteDeliveryMethod,
} from "@/modules/commerce/delivery";
import { getPublicPaymentAvailability } from "@/modules/commerce/payment/service";

export const metadata: Metadata = closedMetadata({
  title: "Оформление заказа",
  description:
    "Оформление заказа EUROPART. Режим менеджера работает без платёжного провайдера.",
  canonical: "/checkout",
});

async function CheckoutContent() {
  await connection();
  const secret = resolveCartSecret();
  if (!secret) {
    return (
      <EmptyState
        description="Нужен CART_SECRET в окружении сервера."
        title="Оформление недоступно"
      />
    );
  }
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  const lines = decodeCart(raw, secret);
  const cart = await resolveCartLines(lines);
  if (cart.lines.length === 0) {
    return (
      <div className="grid gap-4">
        <EmptyState
          description="Сначала добавьте товары в корзину."
          title="Нечего оформлять"
        />
        <Link className="text-brand" href="/cart">
          К корзине
        </Link>
      </div>
    );
  }

  const methods = await listActiveDeliveryMethods();
  const payment = await getPublicPaymentAvailability();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
      <div>
        <CheckoutForm
          deliveryMethods={methods.map((method) => quoteDeliveryMethod(method))}
          onlineAvailable={payment.configured}
          onlineMessage={payment.message}
          subtotalCents={cart.subtotalCents}
        />
      </div>
      <aside className="border border-line bg-surface-muted p-4">
        <h2 className="font-display text-xl font-semibold">Состав</h2>
        <ul className="mt-4 grid gap-3 text-sm">
          {cart.lines.map((line) => (
            <li key={line.offerId}>
              <p className="font-medium">{line.name}</p>
              <p className="text-ink-muted">
                {line.quantity} ×{" "}
                {line.unitPriceCents != null
                  ? `${(line.unitPriceCents / 100).toFixed(2)} BYN`
                  : "цена не задана"}
              </p>
            </li>
          ))}
        </ul>
        {cart.issues.length > 0 ? (
          <p className="mt-4 text-sm text-danger">{cart.issues.join(" ")}</p>
        ) : null}
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Container className="grid gap-8 py-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Оформление заказа</h1>
        <p className="mt-2 text-ink-muted">
          Режим менеджера работает всегда. Онлайн-оплата появляется только при
          настроенном провайдере — без имитации успешной оплаты.
        </p>
      </div>
      <Suspense fallback={<PageSkeleton />}>
        <CheckoutContent />
      </Suspense>
    </Container>
  );
}
