import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { VehicleFinder } from "@/components/vehicle-finder";
import { ProductList } from "@/components/product-card";
import { getHomeData } from "@/lib/catalog";
import { getSettings } from "@/lib/site";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "USAPARTS — новые и контрактные автозапчасти из США" },
  description: "Каталог новых и б/у автозапчастей из США. Поиск по VIN, OEM, артикулу, марке и модели. Заказ отсутствующих позиций.",
  alternates: { canonical: "/" },
};

const STEPS = [
  { title: "Найдите деталь", text: "VIN-заявка, OEM, артикул или каталог марки, модели и года." },
  { title: "Сверьте карточку", text: "Состояние, цена, количество и статус берутся из базы, а не из рекламного текста." },
  { title: "Оформите заказ или заявку", text: "Если цены нет или детали нет в каталоге, сохраняется заявка менеджеру." },
  { title: "Дождитесь подтверждения", text: "Пока платёж и перевозчик не подключены, менеджер подтверждает оплату и доставку отдельно." },
];

const ADVANTAGES = [
  "Новые, б/у и восстановленные позиции в одной базе.",
  "Совместимость с маркой, моделью, годом и кодом двигателя.",
  "Статусы: в наличии, склад в США, в пути, под заказ, нет в наличии.",
  "Заявка на деталь, которой нет в каталоге.",
  "Индексируются только страницы с реальным ассортиментом.",
  "Статус VIN, оплаты и доставки показывается честно, без имитации подключения.",
];

export default async function HomePage() {
  const [data, settings] = await Promise.all([getHomeData(), getSettings()]);
  return (
    <>
      <section className="hero-grid text-white">
        <div className="page grid gap-8 py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-white/70">США · новые и контрактные</p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight md:text-5xl">Автозапчасти из США с понятным статусом наличия</h1>
            <p className="mt-4 max-w-xl text-white/80 leading-7">
              Ищите по OEM и артикулу или оставьте VIN: внешний декодер подключается отдельно, а заявка сразу попадает в базу.
            </p>
            <div className="mt-6">
              <SearchBox large />
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href="/vin-search" className="btn-cta">Подобрать по VIN</Link>
              <Link href="/catalog" className="btn border border-white/30 text-white">Открыть каталог</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Поиск по автомобилю</h2>
            <p className="mb-4 mt-1 text-sm text-white/70">Марка, модель, год, код двигателя и категория.</p>
            <VehicleFinder makes={data.categories.length ? await finder() : []} categories={data.categories.map((item) => ({ name: item.name, slug: item.slug }))} />
          </div>
        </div>
      </section>
      <section className="page py-12">
        <h2 className="text-2xl font-semibold text-navy">Каталог категорий</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((category) => (
            <article key={category.id} className="card p-4">
              <h3 className="font-semibold text-navy">
                <Link href={`/catalog/${category.slug}`}>{category.name}</Link>
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link href={`/catalog/${category.slug}/${child.slug}`}>{child.name}</Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-white py-12">
        <div className="page">
          <h2 className="text-2xl font-semibold text-navy">Популярные марки</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {data.makes.map((make) => (
              <Link key={make.slug} href={`/brands/${make.slug}`} className="card px-4 py-5 font-semibold text-navy">
                {make.name}
                <span className="mt-1 block text-xs font-normal text-slate-500">{make.country}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="page py-12">
        <h2 className="mb-5 text-2xl font-semibold text-navy">Запчасти из США</h2>
        <ProductList products={data.fromUsa} />
      </section>
      <section className="page pb-12">
        <h2 className="mb-5 text-2xl font-semibold text-navy">Новые поступления</h2>
        <ProductList products={data.fresh} />
      </section>
      <section className="page pb-12">
        <h2 className="mb-5 text-2xl font-semibold text-navy">Популярные запчасти</h2>
        <ProductList products={data.featured} />
      </section>
      <section className="bg-white py-12">
        <div className="page">
          <h2 className="text-2xl font-semibold text-navy">Как заказать запчасть из США</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="card p-4">
                <span className="text-sm font-semibold text-cta">0{index + 1}</span>
                <h3 className="mt-2 font-semibold text-navy">{step.title}</h3>
                <p className="mt-2 text-sm leading-6">{step.text}</p>
              </li>
            ))}
          </ol>
          <Link href="/info/how-to-order" className="mt-4 inline-block text-sm font-semibold text-navy underline">
            Подробный порядок заказа
          </Link>
        </div>
      </section>
      <section className="page py-12">
        <h2 className="text-2xl font-semibold text-navy">Преимущества</h2>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {ADVANTAGES.map((item) => (
            <li key={item} className="card p-4 text-sm leading-6">{item}</li>
          ))}
        </ul>
      </section>
      <section className="bg-white py-12">
        <div className="page">
          <h2 className="text-2xl font-semibold text-navy">Отзывы покупателей</h2>
          <p className="mt-2 text-sm text-amber-800">Демонстрационные отзывы для проверки интерфейса. Это не отзывы реальных покупателей.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {data.reviews.map((review) => (
              <article key={review.id} className="card p-4">
                <p className="text-sm text-amber-800">{review.isDemo ? "Тестовый отзыв" : "Отзыв"} · {review.rating}/5</p>
                <h3 className="mt-1 font-semibold text-navy">{review.authorName}</h3>
                <p className="mt-2 text-sm leading-6">{review.body}</p>
                {review.product && (
                  <Link href={`/product/${review.product.slug}`} className="mt-2 inline-block text-sm text-navy underline">
                    {review.product.name}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="page py-12">
        <h2 className="text-2xl font-semibold text-navy">Информационные статьи</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {data.articles.map((article) => (
            <article key={article.slug} className="card p-4">
              <h3 className="font-semibold text-navy">
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </h3>
              <p className="mt-2 text-sm leading-6">{article.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-t border-line bg-white py-12">
        <div className="page prose-us max-w-3xl">
          <h2>Автозапчасти из США в USAPARTS</h2>
          <p>
            USAPARTS принимает заказы на новые и контрактные детали для американских и популярных мировых марок.
            В опубликованном каталоге сейчас {data.productCount} карточек. Пока включён демонстрационный режим ({settings.demoMode ? "да" : "нет"}),
            эти карточки помечены как тестовые: цену, остаток и срок нельзя считать коммерческим предложением.
          </p>
          <p>
            Подбор начинается с VIN, OEM или артикула. Если внешнего декодера нет, форма не притворяется, что распознала автомобиль:
            она проверяет длину и контрольную цифру и сохраняет заявку. Оплата и расчёт перевозчика подключаются адаптерами через переменные окружения.
          </p>
          <p>
            Контакты на сайте: {settings.phone || "телефон не задан"}, {settings.email || "email не задан"}.
            {settings.demoMode ? " В демо-режиме это не рабочие каналы продаж." : ""}
          </p>
        </div>
      </section>
    </>
  );
}

async function finder() {
  const { getFinderData } = await import("@/lib/catalog");
  return getFinderData();
}
