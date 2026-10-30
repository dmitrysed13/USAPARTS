const ERRORS: Record<string, string> = {
  fields: "Проверьте поля формы.",
  rate: "Слишком много запросов. Подождите несколько минут и повторите.",
  file: "Можно загрузить JPEG, PNG или WebP размером до 5 МБ.",
  save: "Не удалось сохранить данные. Попробуйте ещё раз.",
  stock: "В базе недостаточно количества для этого заказа.",
  price: "У позиции нет цены, добавить её в корзину нельзя.",
  coupon: "Промокод не действует.",
  delivery: "Выберите способ доставки.",
  credentials: "Неверный email или пароль.",
  empty: "Корзина пуста.",
  exists: "Пользователь с таким email уже есть.",
  password: "Пароль должен быть не короче 8 символов и содержать букву и цифру.",
  self: "Нельзя снять с себя роль администратора.",
  confirm: "Подтвердите массовое изменение.",
  amount: "Укажите число.",
};

export function Notice({ error, sent, saved }: { error?: string; sent?: string; saved?: string }) {
  if (sent) return <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-ok">Заявка сохранена в базе. Менеджер увидит её в панели.</p>;
  if (saved) return <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-ok">Сохранено.</p>;
  if (!error) return null;
  return <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{ERRORS[error] ?? error}</p>;
}
