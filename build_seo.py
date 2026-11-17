# -*- coding: utf-8 -*-
"""Generate the USAPARTS SEO catalog (static HTML) from the technical spec."""
from __future__ import annotations

import html
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = "https://usaparts.by"
BRAND_NAME = "USAPARTS"
PHONE = "+375 (29) 792-07-86"
PHONE_E164 = "+375297920786"
LASTMOD = "2026-08-18"
TODAY_YEAR = "2026"

PARTS = [
    {"slug": "tormoznye-kolodki", "name": "Тормозные колодки", "group": "Тормозная система", "ice_only": False, "price": 145, "img": "/images/hero-brake-disc.jpg"},
    {"slug": "tormoznye-diski", "name": "Тормозные диски", "group": "Тормозная система", "ice_only": False, "price": 219, "img": "/images/hero-brake-disc.jpg"},
    {"slug": "amortizatory", "name": "Амортизаторы", "group": "Подвеска", "ice_only": False, "price": 268, "img": "/images/gallery-jeep-suspension.jpg"},
    {"slug": "rychagi", "name": "Рычаги", "group": "Подвеска", "ice_only": False, "price": 189, "img": "/images/gallery-jeep-suspension.jpg"},
    {"slug": "sajlentbloki", "name": "Сайлентблоки", "group": "Подвеска", "ice_only": False, "price": 42, "img": "/images/gallery-jeep-suspension.jpg"},
    {"slug": "stojki-stabilizatora", "name": "Стойки стабилизатора", "group": "Подвеска", "ice_only": False, "price": 38, "img": "/images/gallery-jeep-suspension.jpg"},
    {"slug": "filtr-maslyanyj", "name": "Фильтр масляный", "group": "Фильтры", "ice_only": True, "price": 29, "img": "/images/hero-brake-disc.jpg"},
    {"slug": "filtr-vozdushnyj", "name": "Фильтр воздушный", "group": "Фильтры", "ice_only": False, "price": 34, "img": "/images/hero-brake-disc.jpg"},
    {"slug": "filtr-salona", "name": "Фильтр салона", "group": "Фильтры", "ice_only": False, "price": 31, "img": "/images/hero-brake-disc.jpg"},
    {"slug": "filtr-toplivnyj", "name": "Фильтр топливный", "group": "Фильтры", "ice_only": True, "price": 36, "img": "/images/hero-brake-disc.jpg"},
    {"slug": "svechi", "name": "Свечи", "group": "Зажигание", "ice_only": True, "price": 24, "img": "/images/hero-brake-disc.jpg"},
    {"slug": "katushka-zazhiganiya", "name": "Катушка зажигания", "group": "Зажигание", "ice_only": True, "price": 89, "img": "/images/hero-brake-disc.jpg"},
    {"slug": "stupica", "name": "Ступица", "group": "Ходовая", "ice_only": False, "price": 156, "img": "/images/gallery-jeep-suspension.jpg"},
    {"slug": "podshipnik-stupicy", "name": "Подшипник ступицы", "group": "Ходовая", "ice_only": False, "price": 78, "img": "/images/gallery-jeep-suspension.jpg"},
    {"slug": "sharovaya-opora", "name": "Шаровая опора", "group": "Ходовая", "ice_only": False, "price": 54, "img": "/images/gallery-jeep-suspension.jpg"},
    {"slug": "rulevaya-tyaga", "name": "Рулевая тяга", "group": "Ходовая", "ice_only": False, "price": 61, "img": "/images/gallery-jeep-suspension.jpg"},
    {"slug": "rulevoj-nakonechnik", "name": "Рулевой наконечник", "group": "Ходовая", "ice_only": False, "price": 47, "img": "/images/gallery-jeep-suspension.jpg"},
    {"slug": "radiator", "name": "Радиатор", "group": "Охлаждение", "ice_only": False, "price": 312, "img": "/images/gallery-tesla-bodykit.jpg"},
    {"slug": "fara", "name": "Фара", "group": "Кузов", "ice_only": False, "price": 420, "img": "/images/gallery-mustang-headlights.jpg"},
    {"slug": "fonar", "name": "Фонарь", "group": "Кузов", "ice_only": False, "price": 198, "img": "/images/gallery-mustang-headlights.jpg"},
    {"slug": "bamper", "name": "Бампер", "group": "Кузов", "ice_only": False, "price": 365, "img": "/images/gallery-tesla-bodykit.jpg"},
    {"slug": "kapot", "name": "Капот", "group": "Кузов", "ice_only": False, "price": 410, "img": "/images/gallery-tesla-bodykit.jpg"},
    {"slug": "dver", "name": "Дверь", "group": "Кузов", "ice_only": False, "price": 490, "img": "/images/gallery-tesla-bodykit.jpg"},
    {"slug": "zerkalo", "name": "Зеркало", "group": "Кузов", "ice_only": False, "price": 132, "img": "/images/gallery-mustang-headlights.jpg"},
]

BRANDS = [
    {"slug": "chevrolet", "name": "Chevrolet", "priority": True},
    {"slug": "toyota", "name": "Toyota", "priority": True},
    {"slug": "tesla", "name": "Tesla", "priority": True},
    {"slug": "honda", "name": "Honda", "priority": True},
    {"slug": "ford", "name": "Ford", "priority": True},
    {"slug": "kia", "name": "Kia", "priority": True},
    {"slug": "lexus", "name": "Lexus", "priority": True},
    {"slug": "buick", "name": "Buick", "priority": True},
    {"slug": "bmw", "name": "BMW", "priority": True},
    {"slug": "nissan", "name": "Nissan", "priority": True},
    {"slug": "hyundai", "name": "Hyundai", "priority": True},
    {"slug": "jeep", "name": "Jeep", "priority": True},
    {"slug": "mazda", "name": "Mazda", "priority": True},
]

MODELS = [
    {"brand": "chevrolet", "slug": "equinox", "name": "Equinox", "years": "2018–2025", "engines": ["1.5T", "2.0T"], "powertrain": "ice", "blurb": 'Абсолютный лидер по соотношению цены, доступности запчастей и экономии при покупке на аукционах США.'},
    {"brand": "chevrolet", "slug": "trailblazer", "name": "Trailblazer", "years": "2021–2025", "engines": ["1.2T", "1.3T"], "powertrain": "ice", "blurb": 'Компактный кроссовер с современным дизайном и экономичным двигателем.'},
    {"brand": "toyota", "slug": "rav4", "name": "RAV4", "years": "2019–2025", "engines": ["2.5", "Hybrid"], "powertrain": "phev", "blurb": 'Ценится за высокую ликвидность, надёжность и популярность гибридных модификаций.'},
    {"brand": "toyota", "slug": "camry", "name": "Camry", "years": "2018–2025", "engines": ["2.5", "3.5", "Hybrid"], "powertrain": "phev", "blurb": 'Классика с бензиновыми и гибридными силовыми установками, максимальная ликвидность на вторичке.'},
    {"brand": "tesla", "slug": "model-y", "name": "Model Y", "years": "2020–2025", "engines": ["EV"], "powertrain": "ev", "blurb": 'Один из главных хитов в сегменте электромобилей — в том числе благодаря льготным квотам на растаможку.'},
    {"brand": "tesla", "slug": "model-3", "name": "Model 3", "years": "2017–2025", "engines": ["EV"], "powertrain": "ev", "blurb": 'Популярный электроседан с высоким спросом на вторичном рынке США.'},
    {"brand": "honda", "slug": "cr-v", "name": "CR-V", "years": "2017–2025", "engines": ["1.5T", "2.4", "Hybrid"], "powertrain": "phev", "blurb": 'Практичный и надёжный семейный кроссовер.'},
    {"brand": "honda", "slug": "accord", "name": "Accord", "years": "2018–2025", "engines": ["1.5T", "2.0T", "Hybrid"], "powertrain": "phev", "blurb": 'Комфортный и просторный седан.'},
    {"brand": "kia", "slug": "k5", "name": "K5", "years": "2021–2025", "engines": ["1.6T", "2.5"], "powertrain": "ice", "blurb": 'Современный седан, пришедший на смену Optima, с привлекательным дизайном.'},
    {"brand": "lexus", "slug": "nx", "name": "NX", "years": "2018–2025", "engines": ["2.0", "2.5 Hybrid", "350h"], "powertrain": "phev", "blurb": 'Доступный входной билет в мир премиальных компактных кроссоверов.'},
    {"brand": "ford", "slug": "escape", "name": "Escape", "years": "2017–2025", "engines": ["1.5", "2.0", "Hybrid"], "powertrain": "phev", "blurb": 'Близкий аналог Equinox, востребованный за счёт широкого выбора моторов и комплектаций.'},
    {"brand": "ford", "slug": "bronco", "name": "Bronco", "years": "2021–2025", "engines": ["2.3T", "2.7T"], "powertrain": "ice", "blurb": 'Востребованная модель для активного отдыха и бездорожья.'},
    {"brand": "ford", "slug": "mustang", "name": "Mustang", "years": "2015–2025", "engines": ["2.3T", "5.0"], "powertrain": "ice", "blurb": 'Классический американский спорткар, пользующийся спросом под восстановление.'},
    {"brand": "buick", "slug": "envision", "name": "Envision", "years": "2021–2025", "engines": ["2.0T"], "powertrain": "ice", "blurb": 'Среднеразмерный кроссовер с более высоким уровнем комфорта и шумоизоляции.'},
    {"brand": "buick", "slug": "encore-gx", "name": "Encore GX", "years": "2020–2025", "engines": ["1.2T", "1.3T"], "powertrain": "ice", "blurb": 'Компактный городской кроссовер с экономичными турбомоторами.'},
    {"brand": "bmw", "slug": "3-series-g20", "name": "3 Series (G20)", "years": "2019–2025", "engines": ["2.0T", "3.0T"], "powertrain": "ice", "blurb": 'Премиальный спортивный седан, выгодный к покупке по сравнению с рынком Европы.'},
    {"brand": "nissan", "slug": "rogue", "name": "Rogue", "years": "2017–2025", "engines": ["1.5T", "2.5"], "powertrain": "ice", "blurb": 'Американский аналог X-Trail — популярный кроссовер с богатым оснащением.'},
    {"brand": "hyundai", "slug": "santa-fe", "name": "Santa Fe", "years": "2019–2025", "engines": ["2.5", "2.5T", "Hybrid"], "powertrain": "phev", "blurb": 'Вместительный кроссовер для больших семей.'},
    {"brand": "jeep", "slug": "grand-cherokee", "name": "Grand Cherokee", "years": "2014–2025", "engines": ["3.6", "5.7", "2.0T"], "powertrain": "ice", "blurb": 'Выбор любителей классических американских внедорожников (с оглядкой на стоимость растаможки крупных двигателей).'},
    {"brand": "mazda", "slug": "3", "name": "3", "years": "2019–2025", "engines": ["2.0", "2.5"], "powertrain": "ice", "blurb": 'Часто доставляется из США благодаря привлекательным ценам на вторичке.'},
    {"brand": "mazda", "slug": "cx-5", "name": "CX-5", "years": "2017–2025", "engines": ["2.0", "2.5", "2.5T"], "powertrain": "ice", "blurb": 'Часто доставляется из США благодаря привлекательным ценам и наличию версий с полным приводом.'},
]

HERO_PARTS = {
    "tormoznye-kolodki",
    "tormoznye-diski",
    "amortizatory",
    "rychagi",
    "filtr-maslyanyj",
    "filtr-vozdushnyj",
    "filtr-salona",
    "fara",
    "bamper",
    "kapot",
}

PRIORITY_MODELS = {
    ("chevrolet", "equinox"),
    ("chevrolet", "trailblazer"),
    ("toyota", "rav4"),
    ("toyota", "camry"),
    ("tesla", "model-y"),
    ("tesla", "model-3"),
    ("honda", "cr-v"),
    ("honda", "accord"),
    ("kia", "k5"),
    ("lexus", "nx"),
    ("ford", "escape"),
    ("ford", "bronco"),
    ("ford", "mustang"),
    ("buick", "envision"),
    ("buick", "encore-gx"),
    ("bmw", "3-series-g20"),
    ("nissan", "rogue"),
    ("hyundai", "santa-fe"),
    ("jeep", "grand-cherokee"),
    ("mazda", "3"),
    ("mazda", "cx-5"),
}


def e(text) -> str:
    return html.escape(str(text), quote=True)


def clip(text: str, limit: int) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    cut = text[: limit - 1].rsplit(" ", 1)[0]
    return cut.rstrip(" ,;:-") + "…"


def money(value: int) -> str:
    return f"{value:,}".replace(",", " ") + " BYN"


def pick(seed: str, options: list[str]) -> str:
    return options[sum(ord(ch) for ch in seed) % len(options)]


def brand_by_slug(slug: str) -> dict:
    return next(b for b in BRANDS if b["slug"] == slug)


def models_for(brand_slug: str) -> list[dict]:
    return [m for m in MODELS if m["brand"] == brand_slug]


def model_by(brand_slug: str, model_slug: str) -> dict:
    return next(m for m in MODELS if m["brand"] == brand_slug and m["slug"] == model_slug)


def part_by_slug(slug: str) -> dict:
    return next(p for p in PARTS if p["slug"] == slug)


def allowed_parts(model: dict) -> list[dict]:
    if model["powertrain"] == "ev":
        return [p for p in PARTS if not p["ice_only"]]
    return PARTS


def url(*parts: str) -> str:
    path = "/" + "/".join(p.strip("/") for p in parts if p) + "/"
    return path if path != "//" else "/"


def abs_url(path: str) -> str:
    if path == "/":
        return SITE + "/"
    return SITE + path


def seed_num(*bits: str) -> int:
    return sum(ord(ch) for ch in "|".join(bits))


def make_products() -> list[dict]:
    products: list[dict] = [
        {
            "sku": "EQX-BD-001",
            "name": "Тормозной диск передний",
            "kind": "OEM",
            "maker": "Chevrolet",
            "part": "tormoznye-diski",
            "fits": [("chevrolet", "equinox")],
            "price": 289,
            "stock": 6,
            "indexable": True,
            "oem": "EQX-BD-001",
            "country": "США",
            "img": "/images/hero-brake-disc.jpg",
            "active": True,
        },
        {
            "sku": "MST-HL-L",
            "name": "Фара LED левая",
            "kind": "Аналог",
            "maker": "Aftermarket US",
            "part": "fara",
            "fits": [("ford", "mustang")],
            "price": 980,
            "stock": 3,
            "indexable": True,
            "oem": "по VIN",
            "country": "США",
            "img": "/images/gallery-mustang-headlights.jpg",
            "active": True,
        },
        {
            "sku": "GC-ARM-001",
            "name": "Рычаг подвески",
            "kind": "OEM",
            "maker": "Jeep",
            "part": "rychagi",
            "fits": [("jeep", "grand-cherokee")],
            "price": 415,
            "stock": 5,
            "indexable": True,
            "oem": "GC-ARM-001",
            "country": "США",
            "img": "/images/gallery-jeep-suspension.jpg",
            "active": True,
        },
        {
            "sku": "TSL-MY-HOOD",
            "name": "Капот",
            "kind": "Аналог",
            "maker": "Aftermarket US",
            "part": "kapot",
            "fits": [("tesla", "model-y")],
            "price": 1240,
            "stock": 2,
            "indexable": True,
            "oem": "по VIN",
            "country": "США",
            "img": "/images/gallery-tesla-bodykit.jpg",
            "active": True,
        },
    ]

    for model in MODELS:
        if (model["brand"], model["slug"]) not in PRIORITY_MODELS:
            continue
        brand = brand_by_slug(model["brand"])
        for part in allowed_parts(model):
            if part["slug"] not in HERO_PARTS:
                continue
            n = seed_num(model["brand"], model["slug"], part["slug"])
            sku = f"UP-{brand['name'][:3].upper()}-{model['slug'][:4].upper()}-{part['slug'][:4].upper()}-{n % 90 + 10}"
            sku = sku.replace(" ", "")
            stock = 0 if n % 11 == 0 else 2 + (n % 7)
            products.append(
                {
                    "sku": sku,
                    "name": f"{part['name']} {pick(sku, ['передние', 'оригинал', 'аналог'])}".replace("  ", " "),
                    "kind": "OEM" if n % 2 == 0 else "Аналог",
                    "maker": brand["name"] if n % 2 == 0 else "Aftermarket US",
                    "part": part["slug"],
                    "fits": [(model["brand"], model["slug"])],
                    "price": part["price"] + (n % 40),
                    "stock": stock,
                    "indexable": True,
                    "oem": "по VIN",
                    "country": "США",
                    "img": part["img"],
                    "active": True,
                }
            )
    seen = set()
    unique = []
    for product in products:
        if product["sku"] in seen:
            continue
        seen.add(product["sku"])
        unique.append(product)
    return unique


PRODUCTS = make_products()


def products_for(brand: str | None = None, model: str | None = None, part: str | None = None) -> list[dict]:
    out = []
    for product in PRODUCTS:
        if not product["active"] or not product["indexable"]:
            continue
        if part and product["part"] != part:
            continue
        if brand or model:
            ok = False
            for b, m in product["fits"]:
                if brand and b != brand:
                    continue
                if model and m != model:
                    continue
                ok = True
            if not ok:
                continue
        out.append(product)
    return out


def include_in_sitemap(product: dict) -> bool:
    return (
        product["active"]
        and product["indexable"]
        and product["price"] > 0
        and (product["stock"] > 0 or True)
    )


def json_ld(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


def organization_schema() -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": BRAND_NAME,
        "url": SITE + "/",
        "logo": abs_url("/assets/logo.svg"),
        "telephone": PHONE_E164,
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "BY",
            "addressLocality": "Брест",
            "streetAddress": "ул. Московская, 364",
        },
    }


def breadcrumb_schema(items: list[tuple[str, str]]) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i,
                "name": name,
                "item": abs_url(href),
            }
            for i, (name, href) in enumerate(items, start=1)
        ],
    }


def product_schema(product: dict) -> dict:
    availability = "https://schema.org/InStock" if product["stock"] > 0 else "https://schema.org/OutOfStock"
    brand_name = product["maker"]
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product["name"],
        "sku": product["sku"],
        "mpn": product["sku"],
        "brand": {"@type": "Brand", "name": brand_name},
        "offers": {
            "@type": "Offer",
            "url": abs_url(url("product", product["sku"].lower())),
            "priceCurrency": "BYN",
            "price": f"{product['price']:.2f}",
            "availability": availability,
        },
    }


def nav_html() -> str:
    return """
        <nav class="hidden items-center gap-6 text-sm font-medium text-mute lg:flex">
          <a href="/parts/" class="transition hover:text-ink">Каталог</a>
          <a href="/parts/chevrolet/" class="transition hover:text-ink">Chevrolet</a>
          <a href="/parts/toyota/" class="transition hover:text-ink">Toyota</a>
          <a href="/parts/tesla/" class="transition hover:text-ink">Tesla</a>
          <a href="/parts/ford/" class="transition hover:text-ink">Ford</a>
          <a href="/contacts/" class="transition hover:text-ink">Контакты</a>
        </nav>
    """


def request_form(prefill: str = "") -> str:
    return f"""
      <section id="request" class="relative scroll-mt-24 bg-mist/60">
        <div class="mx-auto max-w-6xl px-4 py-16">
          <div class="grid gap-10 lg:grid-cols-12">
            <div class="lg:col-span-5">
              <h2 class="font-display text-3xl font-bold tracking-tight text-ink">Подбор по VIN</h2>
              <p class="mt-4 text-mute">Укажите VIN и OEM-код — подберём оригинал или аналог с ценой в BYN и вариантами доставки по Беларуси. Запчасти из США для авто, популярных на импорте в РБ.</p>
            </div>
            <div class="lg:col-span-7">
              <form class="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft sm:p-8" action="/send.php" method="post" id="request-form" novalidate>
                <input type="text" name="website" tabindex="-1" autocomplete="off" class="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />
                <div class="grid gap-5 sm:grid-cols-2">
                  <div><label class="text-sm font-medium text-ink" for="name">Имя</label><input id="name" name="name" required class="input-field" /></div>
                  <div><label class="text-sm font-medium text-ink" for="phone">Телефон (РБ)</label><input id="phone" name="phone" type="tel" required placeholder="+375 (__) ___-__-__" class="input-field" /></div>
                  <div class="sm:col-span-2"><label class="text-sm font-medium text-ink" for="car">Марка / модель / год</label><input id="car" name="car" required class="input-field" /></div>
                  <div><label class="text-sm font-medium text-ink" for="vin">VIN</label><input id="vin" name="vin" maxlength="17" class="input-field font-mono uppercase" /></div>
                  <div><label class="text-sm font-medium text-ink" for="mileage-form">Пробег, км</label><input id="mileage-form" name="mileage" type="number" min="0" class="input-field" /></div>
                  <div class="sm:col-span-2"><label class="text-sm font-medium text-ink" for="item">Артикул или описание</label><textarea id="item" name="item" required rows="4" class="input-field">{e(prefill)}</textarea></div>
                </div>
                <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button type="submit" id="request-submit" class="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-white hover:bg-accent-hover">
                    <i data-lucide="send" class="h-4 w-4"></i><span id="request-submit-label">Отправить запрос</span>
                  </button>
                  <p class="text-xs text-mute">Нажимая кнопку, вы соглашаетесь на обработку данных для связи по заявке.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    """


def crumbs_html(items: list[tuple[str, str]]) -> str:
    parts = []
    for i, (name, href) in enumerate(items):
        if i < len(items) - 1:
            parts.append(f'<a class="hover:text-ink" href="{e(href)}">{e(name)}</a>')
            parts.append('<span class="text-slate-300">/</span>')
        else:
            parts.append(f'<span class="text-ink">{e(name)}</span>')
    return f'<nav class="mb-6 flex flex-wrap items-center gap-2 text-sm text-mute" aria-label="Хлебные крошки">{"".join(parts)}</nav>'


def product_card(product: dict) -> str:
    href = url("product", product["sku"].lower())
    status = "В наличии" if product["stock"] > 0 else "Временно нет"
    alt = clip(f"{product['name']} {product['sku']} для {product['fits'][0][0].title()}", 75)
    return f"""
      <article class="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <a href="{e(href)}" class="relative aspect-[4/3] overflow-hidden bg-white p-4">
          <img class="h-full w-full object-cover" src="{e(product['img'])}" alt="{e(alt)}" loading="lazy" decoding="async" />
        </a>
        <div class="flex flex-1 flex-col p-5">
          <div class="text-xs font-semibold uppercase tracking-wide text-accent">{e(product['kind'])}</div>
          <h3 class="mt-1 text-base font-semibold text-ink"><a href="{e(href)}">{e(product['name'])}</a></h3>
          <p class="mt-1 text-xs text-mute">Артикул {e(product['sku'])} · OEM {e(product['oem'])}</p>
          <div class="mt-4 flex items-end justify-between gap-3">
            <div>
              <div class="font-display text-xl font-bold text-ink">{money(product['price'])}</div>
              <div class="text-xs text-mute">{e(status)}</div>
            </div>
            <a href="{e(href)}" class="inline-flex items-center rounded-xl bg-accent px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover">Карточка</a>
          </div>
        </div>
      </article>
    """


def layout(
    *,
    title: str,
    description: str,
    canonical: str,
    h1: str | None = None,
    robots: str = "index, follow",
    breadcrumbs: list[tuple[str, str]] | None = None,
    schemas: list[dict] | None = None,
    extra_head: str = "",
    content: str,
    include_form: bool = False,
    prefill: str = "",
) -> str:
    schemas = schemas or []
    breadcrumbs = breadcrumbs or []
    schema_tags = "\n".join(
        f'<script type="application/ld+json">{json_ld(item)}</script>' for item in schemas
    )
    show_crumbs = len(breadcrumbs) > 1
    crumb = crumbs_html(breadcrumbs) if show_crumbs else ""
    heading = f'<h1 class="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-[2.6rem]">{e(h1)}</h1>' if h1 else ""
    top = f'<div class="mx-auto max-w-6xl px-4 pt-8 pb-4">{crumb}{heading}</div>' if (show_crumbs or h1) else ""
    form = request_form(prefill) if include_form else ""
    return f"""<!doctype html>
<html lang="ru" class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{e(title)}</title>
    <meta name="description" content="{e(description)}" />
    <meta name="robots" content="{e(robots)}" />
    <link rel="canonical" href="{e(canonical)}" />
    <link rel="icon" href="/assets/logo.svg" type="image/svg+xml" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ru_BY" />
    <meta property="og:title" content="{e(title)}" />
    <meta property="og:description" content="{e(description)}" />
    <meta property="og:url" content="{e(canonical)}" />
    <meta property="og:image" content="{e(abs_url('/assets/logo.svg'))}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {{
        theme: {{
          extend: {{
            fontFamily: {{
              display: ["Outfit", "system-ui", "sans-serif"],
              sans: ["Manrope", "system-ui", "sans-serif"],
            }},
            colors: {{
              surface: "#FFFFFF",
              mist: "#F8FAFC",
              panel: "#F1F5F9",
              ink: "#0F172A",
              mute: "#64748B",
              accent: {{ DEFAULT: "#059669", hover: "#047857", soft: "#ECFDF5" }},
              skytech: "#0284C7",
            }},
            boxShadow: {{
              soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)",
              lift: "0 4px 6px rgba(15, 23, 42, 0.04), 0 16px 40px rgba(15, 23, 42, 0.08)",
            }},
          }},
        }},
      }};
    </script>
    <script src="https://unpkg.com/lucide@0.469.0"></script>
    <link rel="stylesheet" href="/assets/site.css" />
    {schema_tags}
    {extra_head}
  </head>
  <body class="min-h-screen bg-surface font-sans text-ink antialiased">
    <header class="sticky top-0 z-40 border-b border-slate-100/80 bg-white/85 backdrop-blur-xl">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <a href="/" class="group inline-flex items-center gap-3">
          <img src="/assets/logo.svg" alt="USAPARTS" class="h-11 w-11 rounded-2xl" />
          <div class="leading-tight">
            <div class="font-display text-base font-bold tracking-tight text-ink">USAPARTS <span class="font-sans text-sm font-medium text-mute">· USA → BY</span></div>
            <div class="text-xs text-mute">OEM и аналоги из США</div>
          </div>
        </a>
        {nav_html()}
        <a class="hidden items-center gap-2 rounded-xl border border-slate-100 bg-mist px-3.5 py-2.5 text-sm font-semibold text-ink sm:inline-flex" href="tel:{PHONE_E164}">
          <i data-lucide="phone" class="h-4 w-4 text-accent"></i>{PHONE}
        </a>
      </div>
    </header>
    <main>
      {top}
      {content}
      {form}
    </main>
    <div id="toast" class="pointer-events-none fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-ink shadow-lg" role="status" aria-live="polite"></div>
    <footer class="relative border-t border-slate-100 bg-white">
      <div class="mx-auto max-w-6xl px-4 py-12">
        <div class="grid gap-10 md:grid-cols-12">
          <div class="md:col-span-4">
            <div class="font-display text-lg font-bold text-ink">USAPARTS</div>
            <p class="mt-2 max-w-md text-sm text-mute">Запчасти для авто из США: OEM и аналоги, проверка по VIN и каталожным номерам. Доставка по Беларуси.</p>
            <div class="mt-4 flex flex-wrap gap-3 text-sm">
              <a class="text-accent hover:underline" href="/about/">О компании</a>
              <a class="text-accent hover:underline" href="/contacts/">Контакты</a>
              <a class="text-accent hover:underline" href="/parts/">Каталог</a>
            </div>
          </div>
          <div class="md:col-span-5">
            <div class="text-sm font-semibold text-ink">Марки</div>
            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {"".join(f'<a class="text-mute hover:text-ink" href="{url("parts", b["slug"])}">{e(b["name"])}</a>' for b in BRANDS)}
            </div>
            <div class="mt-5 text-sm font-semibold text-ink">Популярные модели</div>
            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <a class="text-mute hover:text-ink" href="/parts/chevrolet/equinox/">Chevrolet Equinox</a>
              <a class="text-mute hover:text-ink" href="/parts/toyota/rav4/">Toyota RAV4</a>
              <a class="text-mute hover:text-ink" href="/parts/tesla/model-y/">Tesla Model Y</a>
              <a class="text-mute hover:text-ink" href="/parts/honda/cr-v/">Honda CR-V</a>
              <a class="text-mute hover:text-ink" href="/parts/ford/escape/">Ford Escape</a>
              <a class="text-mute hover:text-ink" href="/parts/toyota/camry/">Toyota Camry</a>
            </div>
          </div>
          <div class="md:col-span-3">
            <div class="text-sm font-semibold text-ink">Контакты</div>
            <div class="mt-3 space-y-2 text-sm text-mute">
              <a class="block hover:text-ink" href="tel:{PHONE_E164}">{PHONE}</a>
              <div>г. Брест, ул. Московская, 364</div>
              <div>Пн–Пт 10:00–19:00, Сб 11:00–15:00</div>
            </div>
          </div>
        </div>
        <p class="mt-8 text-xs text-slate-400">© <span id="year">{TODAY_YEAR}</span> USAPARTS · реквизиты на странице <a class="underline" href="/contacts/">контактов</a></p>
      </div>
    </footer>
    <script src="/assets/site.js"></script>
  </body>
</html>
"""


def write_page(path: Path, html_doc: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html_doc, encoding="utf-8")


def advantages() -> str:
    return """
      <ul class="mt-8 grid gap-3 sm:grid-cols-2">
        <li class="rounded-xl border border-slate-100 bg-white p-4 text-sm">OEM и проверенные аналоги из США</li>
        <li class="rounded-xl border border-slate-100 bg-white p-4 text-sm">Поставка из США — подбор под авто с аукционов и импорта в РБ</li>
        <li class="rounded-xl border border-slate-100 bg-white p-4 text-sm">Подбор оригинальной детали по VIN</li>
        <li class="rounded-xl border border-slate-100 bg-white p-4 text-sm">Проверка по OEM-коду и каталожным номерам</li>
        <li class="rounded-xl border border-slate-100 bg-white p-4 text-sm">Доставка по Беларуси</li>
        <li class="rounded-xl border border-slate-100 bg-white p-4 text-sm">Цена и наличие в BYN до отправки заявки</li>
      </ul>
    """


def faq_block(items: list[tuple[str, str]]) -> str:
    rows = "".join(
        f'<details class="rounded-xl border border-slate-100 bg-white p-4"><summary class="cursor-pointer font-semibold">{e(q)}</summary><p class="mt-2 text-sm text-mute">{e(a)}</p></details>'
        for q, a in items
    )
    return f'<section class="mt-10 space-y-3"><h2 class="font-display text-2xl font-bold">FAQ</h2>{rows}</section>'


def seo_text(paragraphs: list[str]) -> str:
    body = "".join(f"<p>{e(p)}</p>" for p in paragraphs)
    return f'<section class="seo-text mt-10 max-w-3xl text-sm leading-relaxed text-mute"><h2 class="mb-3 font-display text-2xl font-bold text-ink">Справка по подбору</h2>{body}</section>'


def render_home() -> str:
    title = clip("Запчасти для авто из США — купить в Беларуси | USAPARTS", 70)
    description = clip(
        "Запчасти для автомобилей из США. OEM и аналоги, цена и наличие. Подбор по VIN. Доставка по Беларуси.",
        160,
    )
    brands_html = "".join(
        f'<a class="rounded-2xl border border-slate-100 bg-white px-5 py-4 text-center font-display text-lg font-semibold hover:border-accent" href="{url("parts", b["slug"])}">{e(b["name"])}</a>'
        for b in BRANDS
    )
    cats_html = "".join(
        f'<a class="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium hover:border-accent" href="{url("parts", p["slug"])}">{e(p["name"])}</a>'
        for p in PARTS
    )
    models_js = {}
    for brand in BRANDS:
        models_js[brand["name"]] = [{"slug": m["slug"], "name": m["name"]} for m in models_for(brand["slug"])]
    extra = f"""
    <script>
      window.USAPARTS_MODELS = {json.dumps(models_js, ensure_ascii=False)};
      window.USAPARTS_SLUGS = {{ brands: {json.dumps({b["name"]: b["slug"] for b in BRANDS}, ensure_ascii=False)} }};
    </script>
    """
    part_opts = "".join(f'<option value="{p["slug"]}">{e(p["name"])}</option>' for p in PARTS)
    brand_opts = "".join(f'<option value="{e(b["name"])}">{e(b["name"])}</option>' for b in BRANDS)
    popular = "".join(product_card(p) for p in PRODUCTS[:8] if p["stock"] > 0)
    content = f"""
      <section class="relative overflow-hidden">
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-4 lg:grid-cols-12">
          <div class="lg:col-span-6">
            <p class="animate-rise font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">USAPARTS</p>
            <h1 class="animate-rise-delay mt-4 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl">Запчасти для авто из США — купить в Беларуси</h1>
            <p class="animate-rise-late mt-5 max-w-xl text-base leading-relaxed text-mute">OEM и аналоги для Chevrolet, Toyota, Tesla, Honda, Ford и других марок, популярных на импорте из США в РБ. Сверка по VIN, цена в BYN.</p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a href="#search" class="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white hover:bg-accent-hover">Подобрать деталь</a>
              <a href="/parts/" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold">Открыть каталог</a>
            </div>
            {advantages()}
          </div>
          <div class="lg:col-span-6">
            <img class="h-[340px] w-full rounded-2xl object-cover sm:h-[420px]" src="/images/gallery-tesla-bodykit.jpg" alt="Автомобили из США — поставки OEM-запчастей USAPARTS в Беларусь" />
          </div>
        </div>
      </section>
      <section id="search" class="scroll-mt-24">
        <div class="mx-auto max-w-6xl px-4 pb-16">
          <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 class="font-display text-2xl font-bold">Подбор запчасти</h2>
            <p class="mt-2 text-sm text-mute">Марка и модель ведут на посадочную страницу. VIN и OEM оставляйте в заявке, если нужен точный каталожный номер.</p>
            <form id="parts-finder" class="mt-6 space-y-5">
              <div data-panel="1" class="grid gap-4 sm:grid-cols-3">
                <div><label class="text-sm font-medium" for="brand">Марка</label><select id="brand" name="brand" required class="input-field"><option value="">Выберите бренд</option>{brand_opts}</select></div>
                <div><label class="text-sm font-medium" for="model">Модель</label><select id="model" name="model" class="input-field" disabled><option value="">Сначала выберите марку</option></select></div>
                <div><label class="text-sm font-medium" for="part_slug">Тип детали</label><select id="part_slug" name="part_slug" class="input-field"><option value="">Необязательно</option>{part_opts}</select></div>
              </div>
              <div data-panel="2" class="hidden">
                <label class="text-sm font-medium" for="vin-search">VIN-номер</label>
                <input id="vin-search" name="vin" maxlength="17" class="input-field font-mono uppercase" placeholder="17-значный VIN автомобиля" />
              </div>
              <div data-panel="3" class="hidden grid gap-4 sm:grid-cols-2">
                <div><label class="text-sm font-medium" for="sku">OEM / артикул</label><input id="sku" name="sku" class="input-field font-mono" /></div>
                <div><label class="text-sm font-medium" for="part-name">Название детали</label><input id="part-name" name="part" class="input-field" /></div>
              </div>
              <div class="mt-4 flex flex-wrap gap-2" role="tablist">
                <button type="button" class="step-tab rounded-xl border px-4 py-2 text-sm font-semibold" data-step="1" aria-selected="true">1. Авто</button>
                <button type="button" class="step-tab rounded-xl border px-4 py-2 text-sm font-semibold" data-step="2" aria-selected="false">2. VIN</button>
                <button type="button" class="step-tab rounded-xl border px-4 py-2 text-sm font-semibold" data-step="3" aria-selected="false">3. OEM</button>
              </div>
              <div class="flex gap-2">
                <button type="button" id="step-prev" class="rounded-xl border px-4 py-3 text-sm font-semibold">Назад</button>
                <button type="button" id="step-next" class="rounded-xl border px-4 py-3 text-sm font-semibold">Далее</button>
                <button type="submit" class="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white">Перейти в каталог</button>
              </div>
            </form>
          </div>
        </div>
      </section>
      <section class="bg-mist/70">
        <div class="mx-auto max-w-6xl px-4 py-14">
          <h2 class="font-display text-3xl font-bold">Марки</h2>
          <p class="mt-2 text-mute">Отдельные посадочные: марка → модель → тип детали → товар.</p>
          <div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">{brands_html}</div>
        </div>
      </section>
      <section>
        <div class="mx-auto max-w-6xl px-4 py-14">
          <h2 class="font-display text-3xl font-bold">Типы запчастей</h2>
          <div class="mt-6 flex flex-wrap gap-3">{cats_html}</div>
        </div>
      </section>
      <section id="catalog" class="bg-mist/50">
        <div class="mx-auto max-w-6xl px-4 py-14">
          <h2 class="font-display text-3xl font-bold">Популярные позиции</h2>
          <p class="mt-2 text-mute">Карточки с артикулом, OEM-подбором, ценой в BYN и наличием.</p>
          <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{popular}</div>
        </div>
      </section>
      <section id="logistics">
        <div class="mx-auto max-w-6xl px-4 py-14">
          <h2 class="font-display text-3xl font-bold">Доставка по Беларуси</h2>
          <p class="mt-3 max-w-3xl text-mute">Прямые поставки из США. Авиа — для срочных позиций, море — для кузова и подвески. Срок зависит от склада и маршрута и подтверждается в расчёте.</p>
          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-100 bg-white p-6"><div class="font-semibold">Авиа</div><div class="mt-2 font-display text-3xl font-bold">по расчёту</div><p class="mt-2 text-sm text-mute">Оптика, электроника, срочные узлы</p></div>
            <div class="rounded-2xl border border-slate-100 bg-white p-6"><div class="font-semibold">Ж/д и море</div><div class="mt-2 font-display text-3xl font-bold">по расчёту</div><p class="mt-2 text-sm text-mute">Кузов, подвеска, крупногабарит</p></div>
          </div>
        </div>
      </section>
    """
    # Home has its own H1 inside content
    html_doc = layout(
        title=title,
        description=description,
        canonical=abs_url("/"),
        h1=None,
        breadcrumbs=[("Главная", "/")],
        schemas=[organization_schema(), breadcrumb_schema([("Главная", "/")])],
        extra_head=extra,
        content=content.replace('<div class="mx-auto max-w-6xl px-4 pt-8 pb-4"></div>', "", 1) if False else content,
        include_form=True,
    )
    # Remove empty heading wrapper for home: layout still prints empty crumbs+h1 wrapper.
    return html_doc


def group_links(model: dict) -> str:
    groups: dict[str, list[dict]] = {}
    for part in allowed_parts(model):
        groups.setdefault(part["group"], []).append(part)
    blocks = []
    for group, items in groups.items():
        links = "".join(
            f'<a class="rounded-lg bg-mist px-3 py-2 text-sm hover:bg-panel" href="{url("parts", model["brand"], model["slug"], p["slug"])}">{e(p["name"])}</a>'
            for p in items
        )
        blocks.append(f'<div class="mt-4"><h3 class="text-sm font-semibold text-mute">{e(group)}</h3><div class="mt-2 flex flex-wrap gap-2">{links}</div></div>')
    return "".join(blocks)


def render_parts_hub() -> str:
    title = clip("Запчасти для авто из США — купить в Беларуси | USAPARTS", 70)
    description = clip(
        "Каталог запчастей для авто из США: марки, модели и типы деталей. Оригинал и аналоги, подбор по VIN, доставка по Беларуси.",
        160,
    )
    brands = "".join(
        f'<a class="rounded-2xl border border-slate-100 bg-white p-5 hover:border-accent" href="{url("parts", b["slug"])}"><div class="font-display text-xl font-bold">{e(b["name"])}</div><div class="mt-1 text-sm text-mute">{len(models_for(b["slug"]))} моделей</div></a>'
        for b in BRANDS
    )
    cats = "".join(
        f'<a class="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm hover:border-accent" href="{url("parts", p["slug"])}">{e(p["name"])}</a>'
        for p in PARTS
    )
    content = f'<div class="mx-auto max-w-6xl px-4 pb-16"><p class="max-w-2xl text-mute">Краткий коммерческий intro: не общий склад «всего из США», а посадочные под модель и тип детали.</p><h2 class="mt-8 font-display text-2xl font-bold">Марки</h2><div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{brands}</div><h2 class="mt-10 font-display text-2xl font-bold">Типы запчастей</h2><div class="mt-4 flex flex-wrap gap-3">{cats}</div></div>'
    return layout(
        title=title,
        description=description,
        canonical=abs_url("/parts/"),
        h1="Запчасти для автомобилей из США",
        breadcrumbs=[("Главная", "/"), ("Каталог", "/parts/")],
        schemas=[breadcrumb_schema([("Главная", "/"), ("Каталог", "/parts/")])],
        content=content,
        include_form=True,
    )


def render_brand(brand: dict) -> str:
    title = clip(f"Запчасти {brand['name']} из США — купить в Беларуси | USAPARTS", 70)
    description = clip(
        f"Запчасти для {brand['name']} из США. Оригинальные детали и аналоги, цена и наличие. Подбор по VIN. Доставка по РБ.",
        160,
    )
    cards = "".join(
        f'<a class="rounded-2xl border border-slate-100 bg-white p-5 hover:border-accent" href="{url("parts", brand["slug"], m["slug"])}"><div class="font-display text-lg font-bold">{e(brand["name"])} {e(m["name"])}</div><div class="mt-1 text-sm text-mute">{e(m["years"])} · {e(", ".join(m["engines"]))}</div></a>'
        for m in models_for(brand["slug"])
    )
    content = f"""
      <div class="mx-auto max-w-6xl px-4 pb-16">
        <p class="max-w-2xl text-mute">Каталог запчастей {e(brand['name'])}: сначала выберите модель, затем тип детали. На карточках — OEM, совместимость и цена в BYN.</p>
        <h2 class="mt-8 font-display text-2xl font-bold">Модели</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>
        {faq_block([
            (f"Как подобрать деталь на {brand['name']}?", "Пришлите VIN и название узла. Сверяем OEM-каталог и предлагаем оригинал или аналог."),
            ("Есть ли доставка по Беларуси?", "Да. После подтверждения позиции согласовываем доставку по РБ."),
        ])}
        {seo_text([
            f"Страница марки {brand['name']} собирает модели, популярные при импорте из США в Беларусь. У каждой модели своя посадочная с типами деталей.",
            "Если товара нет в витрине, оставьте заявку с VIN — проверим склад в Китае и аналоги.",
        ])}
      </div>
    """
    return layout(
        title=title,
        description=description,
        canonical=abs_url(url("parts", brand["slug"])),
        h1=f"Запчасти {brand['name']}",
        breadcrumbs=[("Главная", "/"), ("Каталог", "/parts/"), (brand["name"], url("parts", brand["slug"]))],
        schemas=[breadcrumb_schema([("Главная", "/"), ("Каталог", "/parts/"), (brand["name"], url("parts", brand["slug"]))])],
        content=content,
        include_form=True,
        prefill=brand["name"],
    )


def render_model(brand: dict, model: dict) -> str:
    title = clip(f"Запчасти {brand['name']} {model['name']} из США — купить в Беларуси | USAPARTS", 70)
    description = clip(
        f"Запчасти для {brand['name']} {model['name']} из США. Оригинальные детали и аналоги, цена и наличие. Подбор по VIN. Доставка по РБ.",
        160,
    )
    prods = products_for(brand["slug"], model["slug"])[:8]
    prod_html = "".join(product_card(p) for p in prods) or '<p class="text-sm text-mute">Готовых позиций мало — оставьте VIN, подберём OEM и аналог.</p>'
    content = f"""
      <div class="mx-auto max-w-6xl px-4 pb-16">
        <p class="max-w-2xl text-mute">Запчасти для {e(brand['name'])} {e(model['name'])} ({e(model['years'])}). Сверяем узел по VIN, показываем оригинал и аналоги, цену в BYN и наличие.</p>
        {f'<p class="mt-3 max-w-2xl text-sm text-mute">{e(model["blurb"])}</p>' if model.get("blurb") else ""}
        <div class="mt-6 flex flex-wrap gap-2 text-sm text-mute">
          <span class="rounded-lg bg-mist px-3 py-1">Годы: {e(model['years'])}</span>
          <span class="rounded-lg bg-mist px-3 py-1">Модификации: {e(", ".join(model["engines"]))}</span>
        </div>
        <h2 class="mt-10 font-display text-2xl font-bold">Популярные категории</h2>
        {group_links(model)}
        <h2 class="mt-10 font-display text-2xl font-bold">Товары</h2>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{prod_html}</div>
        {advantages()}
        {faq_block([
            (f"Как отличить оригинал для {model['name']} от аналога?", "Оригинал сверяем по OEM-каталогу производителя. Аналог — проверенный aftermarket с контролем совместимости по VIN."),
            ("Можно ли заказать, если позиции нет в наличии?", "Да. Страница остаётся доступной, предлагаем аналог или поставку под заказ."),
        ])}
        {seo_text([
            f"Для {brand['name']} {model['name']} важны не только название детали, но и поколение, двигатель и кузов. Поэтому посадочные идут по типу запчасти, а точный номер подтверждаем по VIN.",
            "Доставка по Беларуси. Юридические реквизиты — на странице контактов.",
        ])}
      </div>
    """
    crumbs = [("Главная", "/"), ("Каталог", "/parts/"), (brand["name"], url("parts", brand["slug"])), (model["name"], url("parts", brand["slug"], model["slug"]))]
    return layout(
        title=title,
        description=description,
        canonical=abs_url(url("parts", brand["slug"], model["slug"])),
        h1=f"Запчасти для {brand['name']} {model['name']}",
        breadcrumbs=crumbs,
        schemas=[breadcrumb_schema(crumbs)],
        content=content,
        include_form=True,
        prefill=f"{brand['name']} {model['name']}",
    )


def render_landing(brand: dict, model: dict, part: dict) -> str:
    title = clip(f"{part['name']} {brand['name']} {model['name']} — купить | USAPARTS", 70)
    description = clip(
        f"Купить {part['name'].lower()} для {brand['name']} {model['name']}. Оригинал и аналоги, цена и наличие. Подбор по VIN. Доставка по Беларуси.",
        160,
    )
    prods = products_for(brand["slug"], model["slug"], part["slug"])
    prod_html = "".join(product_card(p) for p in prods) or (
        f'<div class="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-mute">Готовых карточек мало. Оставьте VIN — подберём {e(part["name"].lower())} по OEM, покажем оригинал и аналог, цену в BYN.</div>'
    )
    related = "".join(
        f'<a class="rounded-lg bg-mist px-3 py-2 text-sm" href="{url("parts", brand["slug"], model["slug"], p["slug"])}">{e(p["name"])}</a>'
        for p in allowed_parts(model)
        if p["group"] == part["group"] and p["slug"] != part["slug"]
    )
    content = f"""
      <div class="mx-auto max-w-6xl px-4 pb-16">
        <p class="max-w-2xl text-mute">{e(part['name'])} для {e(brand['name'])} {e(model['name'])}: оригинал и аналоги, проверка по OEM, доставка по Беларуси.</p>
        <h2 class="mt-8 font-display text-2xl font-bold">Товары</h2>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{prod_html}</div>
        <h2 class="mt-10 font-display text-2xl font-bold">Совместимость</h2>
        <p class="mt-2 text-sm text-mute">{e(brand['name'])} {e(model['name'])} · {e(model['years'])} · {e(", ".join(model["engines"]))}. Точную применимость подтверждаем по VIN, не списком из 50 моделей.</p>
        <h2 class="mt-8 font-display text-2xl font-bold">OEM и аналоги</h2>
        <p class="mt-2 text-sm text-mute">OEM-коды и заводские номера из США сверяем по каталогу. Если нужен аналог — подбираем совместимую замену с тем же посадочным местом.</p>
        <h2 class="mt-8 font-display text-2xl font-bold">Рядом в узле</h2>
        <div class="mt-3 flex flex-wrap gap-2">{related or '<span class="text-sm text-mute">См. другие типы на странице модели.</span>'}</div>
        {faq_block([
            (f"Как купить {part['name'].lower()} на {model['name']}?", "Откройте карточку товара или отправьте VIN. Мы подтвердим OEM, цену в BYN и срок поставки."),
            ("Почему не все фильтры в URL?", "Технические сортировки и комбинации фильтров не индексируются. Индексируются только эти посадочные."),
        ])}
        {seo_text([
            f"{part['name']} на {brand['name']} {model['name']} лучше искать в связке с моделью, а не с общим словом «авто из США». Так видно совместимость, артикул и наличие.",
            "Страница не повторяет ключ в каждом предложении: здесь факты по подбору, OEM и доставке по РБ.",
        ])}
      </div>
    """
    crumbs = [
        ("Главная", "/"),
        (brand["name"], url("parts", brand["slug"])),
        (model["name"], url("parts", brand["slug"], model["slug"])),
        (part["group"], url("parts", brand["slug"], model["slug"])),
        (part["name"], url("parts", brand["slug"], model["slug"], part["slug"])),
    ]
    return layout(
        title=title,
        description=description,
        canonical=abs_url(url("parts", brand["slug"], model["slug"], part["slug"])),
        h1=f"{part['name']} для {brand['name']} {model['name']}",
        breadcrumbs=crumbs,
        schemas=[breadcrumb_schema(crumbs)],
        content=content,
        include_form=True,
        prefill=f"{part['name']} {brand['name']} {model['name']}",
    )


def render_category(part: dict) -> str:
    title = clip(f"{part['name']} для авто из США — купить в Беларуси | USAPARTS", 70)
    description = clip(
        f"Купить {part['name'].lower()} для авто из США. Оригинал и аналоги, цена и наличие. Подбор по VIN. Доставка по Беларуси.",
        160,
    )
    brand_blocks = []
    for brand in BRANDS:
        links = []
        for model in models_for(brand["slug"]):
            if part["ice_only"] and model["powertrain"] == "ev":
                continue
            links.append(f'<a class="text-sm text-accent hover:underline" href="{url("parts", brand["slug"], model["slug"], part["slug"])}">{e(model["name"])}</a>')
        if not links:
            continue
        brand_blocks.append(
            f'<div class="rounded-2xl border border-slate-100 bg-white p-5"><div class="font-display text-lg font-bold"><a href="{url("parts", brand["slug"])}">{e(brand["name"])}</a></div><div class="mt-3 flex flex-wrap gap-x-4 gap-y-2">{"".join(links)}</div></div>'
        )
    content = f'<div class="mx-auto max-w-6xl px-4 pb-16"><p class="max-w-2xl text-mute">{e(part["name"])} для марок, популярных на импорте из США: выберите модель, чтобы открыть посадочную с OEM, наличием и ценой.</p><div class="mt-8 grid gap-4 md:grid-cols-2">{"".join(brand_blocks)}</div></div>'
    crumbs = [("Главная", "/"), ("Каталог", "/parts/"), (part["name"], url("parts", part["slug"]))]
    return layout(
        title=title,
        description=description,
        canonical=abs_url(url("parts", part["slug"])),
        h1=f"{part['name']} для авто из США",
        breadcrumbs=crumbs,
        schemas=[breadcrumb_schema(crumbs)],
        content=content,
        include_form=True,
        prefill=part["name"],
    )


def render_product(product: dict) -> str:
    brand_slug, model_slug = product["fits"][0]
    brand = brand_by_slug(brand_slug)
    model = model_by(brand_slug, model_slug)
    part = part_by_slug(product["part"])
    title = clip(f"{product['name']} {product['sku']} — купить в Беларуси | USAPARTS", 70)
    description = clip(
        f"Купить {product['name']} {product['sku']} для {brand['name']} {model['name']}. Оригинал и аналоги, цена и наличие. Подбор по VIN. Доставка по Беларуси.",
        160,
    )
    h1 = f"{part['name']} {product['maker']} {product['sku']}"
    alt = clip(f"{product['name']} {product['sku']} для {brand['name']} {model['name']}", 75)
    status = "В наличии" if product["stock"] > 0 else "Временно нет"
    analog = products_for(brand_slug, model_slug, product["part"])
    analog_html = "".join(product_card(p) for p in analog if p["sku"] != product["sku"])
    fits_priority = []
    fits_rest = []
    for b, m in product["fits"]:
        bb, mm = brand_by_slug(b), model_by(b, m)
        link = f'<a class="text-accent hover:underline" href="{url("parts", b, m)}">{e(bb["name"])} {e(mm["name"])}</a>'
        if (b, m) in PRIORITY_MODELS:
            fits_priority.append(link)
        else:
            fits_rest.append(link)
    rest = ""
    if fits_rest:
        rest = f'<details class="mt-2"><summary class="cursor-pointer text-sm">Показать все модели</summary><div class="mt-2 flex flex-wrap gap-3">{"".join(fits_rest)}</div></details>'
    content = f"""
      <div class="mx-auto max-w-6xl px-4 pb-16">
        <div class="grid gap-8 lg:grid-cols-2">
          <img class="w-full rounded-2xl border border-slate-100 object-cover" src="{e(product['img'])}" alt="{e(alt)}" />
          <div>
            <div class="text-sm text-mute">{e(product['kind'])} · {e(status)}</div>
            <div class="mt-4 font-display text-3xl font-bold">{money(product['price'])}</div>
            <dl class="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div><dt class="text-mute">Артикул</dt><dd class="font-semibold">{e(product['sku'])}</dd></div>
              <div><dt class="text-mute">OEM</dt><dd class="font-semibold">{e(product['oem'])}</dd></div>
              <div><dt class="text-mute">Производитель</dt><dd class="font-semibold">{e(product['maker'])}</dd></div>
              <div><dt class="text-mute">Страна</dt><dd class="font-semibold">{e(product['country'])}</dd></div>
            </dl>
            <h2 class="mt-8 text-lg font-bold">Подходит для</h2>
            <div class="mt-2 flex flex-wrap gap-3">{"".join(fits_priority) or "".join(fits_rest)}</div>
            {rest}
            <a class="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white" href="#request">Запросить VIN-подбор</a>
          </div>
        </div>
        <h2 class="mt-12 font-display text-2xl font-bold">Характеристики и совместимость</h2>
        <p class="mt-2 max-w-3xl text-sm text-mute">Совместимость подтверждаем по VIN и OEM-каталогу. Не размещаем 50 моделей сплошным текстом — приоритетные модели доступны ссылками.</p>
        <h2 class="mt-8 font-display text-2xl font-bold">Аналоги</h2>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{analog_html or '<p class="text-sm text-mute">Аналог подберём по заявке.</p>'}</div>
        <h2 class="mt-8 font-display text-2xl font-bold">Доставка и гарантия</h2>
        <p class="mt-2 text-sm text-mute">Доставка по Беларуси. Срок зависит от склада в Китае и маршрута, фиксируем в расчёте. Гарантия на сохранность поставки и соответствие подобранному OEM.</p>
        {faq_block([
            ("Как проверить OEM?", "Пришлите VIN и фото шильдика при наличии. Сверяем каталожный номер до оплаты."),
            ("Что если позиция временно нет?", "Страница остаётся 200 OK. Предложим аналог или поставку под заказ."),
        ])}
      </div>
    """
    crumbs = [
        ("Главная", "/"),
        (brand["name"], url("parts", brand_slug)),
        (model["name"], url("parts", brand_slug, model_slug)),
        (part["name"], url("parts", brand_slug, model_slug, part["slug"])),
        (product["sku"], url("product", product["sku"].lower())),
    ]
    return layout(
        title=title,
        description=description,
        canonical=abs_url(url("product", product["sku"].lower())),
        h1=h1,
        breadcrumbs=crumbs,
        schemas=[breadcrumb_schema(crumbs), product_schema(product)],
        content=content,
        include_form=True,
        prefill=f"{product['name']} {product['sku']}",
    )


def render_about() -> str:
    title = clip("О компании USAPARTS — запчасти из США в Беларуси", 70)
    description = clip(
        "USAPARTS поставляет OEM-запчасти и аналоги для автомобилей из США. Подбор по VIN и OEM, доставка по Беларуси.",
        160,
    )
    content = """
      <div class="mx-auto max-w-3xl px-4 pb-16 text-sm leading-relaxed text-mute">
        <p>USAPARTS — поставки запчастей для автомобилей из США в Беларусь. Работаем с OEM-каталогами и проверенными аналогами.</p>
        <p class="mt-4">Не обещаем «самые низкие цены в интернете». Даём сверку по VIN, OEM-код, цену в BYN и прозрачный маршрут поставки.</p>
        <p class="mt-4">Юридические реквизиты опубликованы на странице контактов.</p>
      </div>
    """
    crumbs = [("Главная", "/"), ("О компании", "/about/")]
    return layout(
        title=title,
        description=description,
        canonical=abs_url("/about/"),
        h1="О компании USAPARTS",
        breadcrumbs=crumbs,
        schemas=[organization_schema(), breadcrumb_schema(crumbs)],
        content=content,
    )


def render_contacts() -> str:
    title = clip("Контакты USAPARTS — Брест, Беларусь", 70)
    description = clip(
        "Контакты USAPARTS: телефон, адрес в Бресте, режим работы. Подбор запчастей по VIN, доставка по Беларуси.",
        160,
    )
    content = f"""
      <div class="mx-auto max-w-3xl px-4 pb-16">
        <div class="rounded-2xl border border-slate-100 bg-white p-6 text-sm">
          <p><strong>Телефон:</strong> <a href="tel:{PHONE_E164}">{PHONE}</a></p>
          <p class="mt-2"><strong>Адрес:</strong> Беларусь, г. Брест, ул. Московская, 364</p>
          <p class="mt-2"><strong>Режим:</strong> Пн–Пт 10:00–19:00, Сб 11:00–15:00</p>
          <h2 class="mt-6 font-display text-xl font-bold text-ink">Реквизиты</h2>
          <p class="mt-2 text-mute">ИП Чанов Дмитрий Анатольевич</p>
          <p class="text-mute">УНП 291502887</p>
          <p class="text-mute">Торговый реестр № 1203028, от 20.10.2017</p>
        </div>
      </div>
    """
    crumbs = [("Главная", "/"), ("Контакты", "/contacts/")]
    return layout(
        title=title,
        description=description,
        canonical=abs_url("/contacts/"),
        h1="Контакты",
        breadcrumbs=crumbs,
        schemas=[organization_schema(), breadcrumb_schema(crumbs)],
        content=content,
        include_form=True,
    )


def xml_url(loc: str) -> str:
    return f"  <url><loc>{e(abs_url(loc))}</loc><lastmod>{LASTMOD}</lastmod></url>"


def write_sitemap(name: str, locs: list[str]) -> None:
    body = "\n".join(xml_url(loc) for loc in locs)
    text = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}\n</urlset>\n'
    path = ROOT / "sitemap" / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def write_support_files(urls: dict[str, list[str]]) -> None:
    index = """<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://usaparts.by/sitemap/categories.xml</loc></sitemap>
  <sitemap><loc>https://usaparts.by/sitemap/brands.xml</loc></sitemap>
  <sitemap><loc>https://usaparts.by/sitemap/models.xml</loc></sitemap>
  <sitemap><loc>https://usaparts.by/sitemap/seo-pages.xml</loc></sitemap>
  <sitemap><loc>https://usaparts.by/sitemap/products-1.xml</loc></sitemap>
</sitemapindex>
"""
    (ROOT / "sitemap.xml").write_text(index, encoding="utf-8")
    for name, locs in urls.items():
        write_sitemap(name, locs)

    robots = """User-agent: *
Allow: /

Disallow: /search
Disallow: /cart
Disallow: /checkout
Disallow: /compare
Disallow: /send.php
Disallow: /build_seo.py
Disallow: /nginx-seo.conf

Disallow: /*?sort=
Disallow: /*?order=
Disallow: /*?price=
Disallow: /*?price_from=
Disallow: /*?price_to=
Disallow: /*?view=
Disallow: /*?per_page=
Disallow: /*?filter=

Sitemap: https://usaparts.by/sitemap.xml
"""
    (ROOT / "robots.txt").write_text(robots, encoding="utf-8")

    htaccess = """DirectoryIndex index.html index.php

RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://usaparts.by%{REQUEST_URI} [L,R=301]
RewriteCond %{HTTP_HOST} ^www\\.usaparts\\.by$ [NC]
RewriteRule ^ https://usaparts.by%{REQUEST_URI} [L,R=301]
"""
    (ROOT / ".htaccess").write_text(htaccess, encoding="utf-8")

    nginx = """# Вставить в server-блоки хостинга.
server {
    listen 80;
    server_name usaparts.by www.usaparts.by;
    return 301 https://usaparts.by$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.usaparts.by;
    return 301 https://usaparts.by$request_uri;
}

server {
    listen 443 ssl http2;
    server_name usaparts.by;
    root /path/to/site;
    index index.html index.php;

    location = /send.php {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
"""
    (ROOT / "nginx-seo.conf").write_text(nginx, encoding="utf-8")


def main() -> None:
    generated = ROOT / "parts"
    products_dir = ROOT / "product"
    if generated.exists():
        shutil.rmtree(generated)
    if products_dir.exists():
        shutil.rmtree(products_dir)

    urls = {
        "categories.xml": ["/", "/parts/", "/about/", "/contacts/"] + [url("parts", p["slug"]) for p in PARTS],
        "brands.xml": [url("parts", b["slug"]) for b in BRANDS],
        "models.xml": [url("parts", m["brand"], m["slug"]) for m in MODELS],
        "seo-pages.xml": [],
        "products-1.xml": [],
    }

    write_page(ROOT / "index.html", render_home())
    write_page(ROOT / "parts" / "index.html", render_parts_hub())
    write_page(ROOT / "about" / "index.html", render_about())
    write_page(ROOT / "contacts" / "index.html", render_contacts())

    for part in PARTS:
        write_page(ROOT / "parts" / part["slug"] / "index.html", render_category(part))

    for brand in BRANDS:
        write_page(ROOT / "parts" / brand["slug"] / "index.html", render_brand(brand))
        for model in models_for(brand["slug"]):
            write_page(ROOT / "parts" / brand["slug"] / model["slug"] / "index.html", render_model(brand, model))
            for part in allowed_parts(model):
                loc = url("parts", brand["slug"], model["slug"], part["slug"])
                write_page(ROOT / "parts" / brand["slug"] / model["slug"] / part["slug"] / "index.html", render_landing(brand, model, part))
                urls["seo-pages.xml"].append(loc)

    for product in PRODUCTS:
        if include_in_sitemap(product):
            write_page(ROOT / "product" / product["sku"].lower() / "index.html", render_product(product))
            urls["products-1.xml"].append(url("product", product["sku"].lower()))

    write_support_files(urls)
    print(
        "pages:",
        4 + len(BRANDS) + len(MODELS) + len(PARTS) + len(urls["seo-pages.xml"]) + len(urls["products-1.xml"]),
        "seo-landings:",
        len(urls["seo-pages.xml"]),
        "products:",
        len(urls["products-1.xml"]),
    )


if __name__ == "__main__":
    main()
