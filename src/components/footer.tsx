import Link from "next/link";
import { getCategoryTree } from "@/lib/catalog";
import { getSettings } from "@/lib/site";

export async function Footer() {
  const [settings, categories] = await Promise.all([getSettings(), getCategoryTree()]);
  return (
    <footer className="mt-16 bg-navy text-white">
      <div className="page grid gap-8 py-10 md:grid-cols-4">
        <div>
          <p className="text-lg font-semibold">{settings.companyName}</p>
          <p className="mt-2 text-sm leading-6 text-white/75">
            {settings.address || "Адрес не указан."}
            <br />
            {settings.hours}
          </p>
        </div>
        <div>
          <p className="font-semibold">Каталог</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            {categories.slice(0, 8).map((category) => (
              <li key={category.id}>
                <Link href={`/catalog/${category.slug}`}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Покупателям</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li><Link href="/vin-search">Подбор по VIN</Link></li>
            <li><Link href="/info/how-to-order">Как заказать</Link></li>
            <li><Link href="/info/delivery">Доставка</Link></li>
            <li><Link href="/blog">Статьи</Link></li>
            <li><Link href="/brands">Марки</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Документы и контакты</p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li><Link href="/info/contacts">Контакты</Link></li>
            <li><Link href="/info/privacy">Персональные данные</Link></li>
            <li><Link href="/info/terms">Условия заказа</Link></li>
            {settings.email && <li><a href={`mailto:${settings.email}`}>{settings.email}</a></li>}
            {settings.phone && <li>{settings.phone}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {settings.companyName}
      </div>
    </footer>
  );
}
