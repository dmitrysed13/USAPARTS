# EUROPART 3.0 — отчёт §6 (cart / orders / payments)

Дата: 2026-11-17.

База: §5 branch `cursor/europart-offers-suppliers-prices-0980` (PR #7).

## Сделано

- Миграция `20261117190000_cart_orders_payments`: расширенные статусы заказа, DeliveryMethod, Order enhancements, OrderStatusHistory, PaymentTransaction, PaymentWebhook; OrderItem.offerId + freshness snapshots.
- Корзина (signed cookie по offerId): add/qty/remove/recalc, проверка актуальности цены/updatedAt на checkout.
- Checkout: менеджерский поток полностью; ONLINE только если `PAYMENT_PROVIDER` + `PAYMENT_WEBHOOK_SECRET`.
- PaymentProvider / PaymentService / webhook (HMAC, idempotent) — без фейкового success.
- Доставка: справочник методов; cost/ETA подтверждает менеджер (admin API).
- Уведомления: email/Telegram шаблоны manager+customer; без SMTP/бота — fail closed, заказ сохраняется.
- Leads API `POST /api/leads` (price request и др.).
- SSR страницы `/cart`, `/checkout`, `/order/[token]`; кнопка «В корзину» на карточке.

## Проверки

См. итоговый прогон в PR: `prisma validate`, typecheck, lint, test, build.

## Не входит

Конкретный BY acquiring SDK, SMTP/Telegram transport adapters, полный admin UI, Better Auth.
