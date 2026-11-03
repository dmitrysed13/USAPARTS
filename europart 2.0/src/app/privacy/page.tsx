import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Container } from "@/components/ui/container";
import { company } from "@/config/company";
import { closedMetadata } from "@/lib/seo/closed";

export const metadata = closedMetadata({
  title: "Обработка данных заявки",
  description:
    "Какие данные VIN-заявки EUROPART сохраняет до подготовки юридического текста политики.",
  canonical: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Container className="grid max-w-3xl gap-6 py-10">
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "Обработка данных" }]}
      />
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Обработка данных заявки
      </h1>
      <p className="leading-7">
        Юридический текст политики ещё не подготовлен. Эта страница описывает только то,
        что форма заявки делает сейчас, и не заменяет документ, который должен проверить
        юрист {company.legalName}.
      </p>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Что сохраняется</h2>
        <ul className="list-disc space-y-2 pl-5 leading-7">
          <li>
            VIN в том виде, в каком его удалось нормализовать, и признак стандартного
            формата.
          </li>
          <li>Марка, модель, год и двигатель, если их заполнили.</li>
          <li>Название запчасти, OEM или артикул и комментарий.</li>
          <li>Имя, телефон и email.</li>
          <li>Время согласия и IP-адрес отправителя.</li>
        </ul>
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Кто это видит</h2>
        <p className="leading-7">
          Публичного списка заявок нет. Запись доступна через базу данных оператору
          компании. Отдельного кабинета сотрудника на этом этапе нет, поэтому доступ
          ограничивается доступом к серверу базы.
        </p>
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Чего форма не делает</h2>
        <p className="leading-7">
          VIN не отправляется во внешний декодер. Письмо и сообщение в Telegram не
          создаются, пока эти каналы не настроены. Согласие в форме относится только к
          сохранению этой заявки.
        </p>
      </section>
      <p>
        <Link className="font-semibold text-brand" href="/vin-search">
          Вернуться к заявке
        </Link>
      </p>
    </Container>
  );
}
