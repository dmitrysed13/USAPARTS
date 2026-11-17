# USAPARTS

Лендинг и SEO-каталог запчастей для автомобилей из США (Belarus / `usaparts.by`).

## Стек

- Статический HTML + Tailwind CDN
- PHP-форма `send.php` (mail)
- Генератор посадочных: `python3 build_seo.py`

## Запуск генерации SEO-страниц

```bash
python3 build_seo.py
```

Создаёт `/parts/…`, `/product/…`, `about/`, `contacts/`, `sitemap.xml`, `robots.txt`, `.htaccess`, `nginx-seo.conf`.

## Форма

`composer.json` пустой — форма использует встроенный `mail()` без Composer-зависимостей. `composer.phar` в репозиторий не включён.
