# John Craddock → Bamper parser

Тестовый парсер каталога [johncraddockltd.co.uk](https://www.johncraddockltd.co.uk/) для последующего импорта в Bamper.by.

**Статус:** Stage 1 (исследование) + Stage 2 (тест 20–30 товаров). Полный обход каталога **заблокирован** до ручной проверки.

## Структура

```
johncraddock_parser/
  main.py              # CLI
  config.py            # лимиты, задержки, сиды категорий
  mapping.json         # маппинг → bamper_import.csv
  requirements.txt
  parser/              # категории, PDP, картинки
  database/            # SQLite + resume-ключи
  exporter/            # CSV / Bamper
  utils/               # HTTPX-клиент, текст
  output/              # CSV, images/, logs/, sqlite
```

## Установка

```bash
cd johncraddock_parser
pip install -r requirements.txt
```

## Запуск (только тест)

```bash
python main.py test
# опционально:
python main.py test --limit 25 --categories 4
```

Режимы `full` и `discover-all` отказываются работать, пока `FULL_RUN_UNLOCKED=False` в `config.py`.

## Выходные файлы

- `output/products.csv`, `categories.csv`, `brands.csv`
- `output/bamper_import.csv` — UTF-8 BOM, разделитель `;`
- `output/images/000001/main.jpg` (+ `extra_N.jpg`)
- `output/parse_report.md`, `output/logs/scrape.log`
- `output/johncraddock.sqlite3`

## Соблюдение правил

- Только публичные страницы; `/_inc` не запрашиваем (robots.txt).
- Вежливый rate-limit / backoff.
- Пустые поля не выдумываем (цены, сток, картинки — только с сайта).
