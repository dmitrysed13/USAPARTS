import Link from "next/link";
import { CartLink } from "@/components/cart-link";
import { SearchBox } from "@/components/search-box";
import { getCategoryTree } from "@/lib/catalog";
import { getSettings } from "@/lib/site";
import { auth } from "@/auth";

export async function Header() {
  const [settings, categories, session] = await Promise.all([getSettings(), getCategoryTree(), auth()]);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="bg-navy text-white">
        <div className="page flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
          <p>Новые и контрактные автозапчасти из США</p>
          <p className="flex flex-wrap gap-3">
            {settings.phone && <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a>}
            {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
            {settings.telegram && (
              <a href={settings.telegram} rel="nofollow noopener">
                Telegram
              </a>
            )}
            {settings.whatsapp && (
              <a href={settings.whatsapp} rel="nofollow noopener">
                WhatsApp
              </a>
            )}
          </p>
        </div>
      </div>
      <div className="page flex flex-wrap items-center gap-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-navy text-sm font-bold text-white">US</span>
          <span>
            <span className="block text-lg font-semibold leading-none tracking-wide text-navy">{settings.companyName}</span>
            <span className="text-xs text-slate-500">автозапчасти из США</span>
          </span>
        </Link>
        <div className="min-w-[240px] flex-1">
          <SearchBox />
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/vin-search" className="font-semibold text-navy">
            Поиск по VIN
          </Link>
          <Link href="/favorites">Избранное</Link>
          <Link href="/compare">Сравнение</Link>
          <CartLink />
          {session?.user ? <Link href="/account">{session.user.name}</Link> : <Link href="/login">Войти</Link>}
        </nav>
      </div>
      <nav className="page flex gap-4 overflow-x-auto pb-3 text-sm" aria-label="Каталог">
        <Link href="/catalog" className="font-semibold text-navy">
          Каталог
        </Link>
        <Link href="/brands">Марки</Link>
        {categories.slice(0, 8).map((category) => (
          <Link key={category.id} href={`/catalog/${category.slug}`} className="whitespace-nowrap text-graphite">
            {category.name}
          </Link>
        ))}
        <Link href="/blog">Статьи</Link>
        <Link href="/info/how-to-order">Как заказать</Link>
      </nav>
    </header>
  );
}
