import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { Notice } from "@/components/notice";
import { submitVinRequest } from "@/server/actions/store";
import { vinDecoderStatus } from "@/lib/integrations/vin-decoder";

export const metadata: Metadata = {
  title: "Подбор запчасти по VIN",
  description: "Заявка на подбор автозапчасти по VIN. Проверяется формат и контрольная цифра. Расшифровка автомобиля доступна только при подключённом декодере.",
  alternates: { canonical: "/vin-search" },
};

const FAQ = [
  {
    question: "Что происходит после отправки VIN?",
    answer: "Заявка сохраняется в базе и появляется в админке. Менеджер подбирает деталь по описанию.",
  },
  {
    question: "Сайт сам определяет машину по VIN?",
    answer: "Нет, если внешний декодер не подключён. Проверяются только длина, допустимые символы и контрольная цифра.",
  },
  {
    question: "Можно заказать деталь, которой нет в каталоге?",
    answer: "Да. Опишите деталь в заявке: каталожная карточка для этого не обязательна.",
  },
];

export default async function VinPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const query = await searchParams;
  const decoder = vinDecoderStatus();
  return (
    <div className="page py-8">
      <Breadcrumbs items={[{ name: "Главная", href: "/" }, { name: "Подбор по VIN" }]} />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <h1 className="text-3xl font-semibold text-navy">Подбор запчасти по VIN</h1>
          <p className="mt-3 leading-7">
            Укажите VIN из 17 символов, автомобиль и какая деталь нужна. {decoder.message}
          </p>
          <form action={submitVinRequest} className="mt-6 space-y-3" encType="multipart/form-data">
            <Notice sent={query.sent} error={query.error} />
            <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />
            <label className="block text-sm">VIN
              <input name="vin" required minLength={17} maxLength={17} className="field mt-1 uppercase" placeholder="17 символов" />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm">Марка<input name="makeName" className="field mt-1" /></label>
              <label className="text-sm">Модель<input name="modelName" className="field mt-1" /></label>
              <label className="text-sm">Год<input name="year" inputMode="numeric" className="field mt-1" /></label>
            </div>
            <label className="block text-sm">Какая деталь нужна
              <textarea name="partDescription" required minLength={5} className="field mt-1 min-h-28" />
            </label>
            <label className="block text-sm">Фото
              <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">Телефон<input name="phone" required className="field mt-1" /></label>
              <label className="text-sm">Email<input name="email" type="email" required className="field mt-1" /></label>
            </div>
            <button className="btn-cta" type="submit">Отправить заявку</button>
          </form>
        </div>
        <aside>
          <h2 className="text-xl font-semibold text-navy">Частые вопросы</h2>
          <div className="mt-4 space-y-4">
            {FAQ.map((item) => (
              <article key={item.question} className="card p-4">
                <h3 className="font-semibold text-navy">{item.question}</h3>
                <p className="mt-2 text-sm leading-6">{item.answer}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }} />
    </div>
  );
}
