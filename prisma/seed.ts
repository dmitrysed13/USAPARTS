import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { hash } from "bcryptjs";
import { PrismaClient, type ProductCondition, type StockStatus } from "@prisma/client";
import { articles, articleCategories } from "./data/articles";
import { landings, pages } from "./data/pages";
import { buildSearchText, normalizeOem } from "../src/lib/normalize";

const prisma = new PrismaClient();

type EngineSeed = { name: string; code: string; fuel?: string; displacementL?: number };
type YearSeed = { year: number; engines: EngineSeed[] };
type ModelSeed = { name: string; slug: string; intro: string; generations: { name: string; slug: string; yearFrom: number; yearTo: number; years: YearSeed[] }[] };
type MakeSeed = { name: string; slug: string; country: string; featured?: boolean; intro: string; models: ModelSeed[] };

function model(name: string, slug: string, year: number, intro?: string, engine?: EngineSeed): ModelSeed {
  return {
    name,
    slug,
    intro: intro ?? `${name}: в справочнике указан ${year} год для навигации по совместимости.`,
    generations: [
      {
        name: String(year),
        slug: `y${year}`,
        yearFrom: year,
        yearTo: year,
        years: [{ year, engines: [engine ?? { name: "Базовый тестовый двигатель", code: "BASE", fuel: "бензин" }] }],
      },
    ],
  };
}

const makes: MakeSeed[] = [
  {
    name: "Ford", slug: "ford", country: "USA", featured: true,
    intro: "В тестовом каталоге Ford собраны Mustang S550, F-150 и соседние модели справочника. Цены карточек демонстрационные.",
    models: [
      {
        name: "Mustang", slug: "mustang",
        intro: "S550, 2015–2023. Для 2018 года в справочнике два мотора: 2.3 EcoBoost и 5.0.",
        generations: [{
          name: "S550", slug: "s550", yearFrom: 2015, yearTo: 2023,
          years: [
            { year: 2018, engines: [{ name: "5.0 Ti-VCT V8", code: "5.0", displacementL: 5, fuel: "бензин" }, { name: "2.3 EcoBoost", code: "2.3", displacementL: 2.3, fuel: "бензин" }] },
            { year: 2020, engines: [{ name: "5.0 Ti-VCT V8", code: "5.0", displacementL: 5, fuel: "бензин" }] },
          ],
        }],
      },
      {
        name: "F-150", slug: "f-150",
        intro: "Пикап F-150 2020 года: в справочнике 3.5 EcoBoost и 5.0.",
        generations: [{
          name: "2018–2020", slug: "2018-2020", yearFrom: 2018, yearTo: 2020,
          years: [{ year: 2020, engines: [{ name: "3.5 EcoBoost", code: "3.5", displacementL: 3.5, fuel: "бензин" }, { name: "5.0 V8", code: "5.0", displacementL: 5, fuel: "бензин" }] }],
        }],
      },
      model("Explorer", "explorer", 2019),
      model("Focus", "focus", 2018),
    ],
  },
  {
    name: "Chevrolet", slug: "chevrolet", country: "USA", featured: true,
    intro: "Chevrolet в тестовой базе: Camaro 2019 и Silverado 2018. Остальные модели нужны справочнику.",
    models: [
      {
        name: "Camaro", slug: "camaro",
        intro: "Шестое поколение. В 2019 году заведены моторы 6.2 и 2.0.",
        generations: [{
          name: "6th gen", slug: "6th", yearFrom: 2016, yearTo: 2024,
          years: [{ year: 2019, engines: [{ name: "6.2 V8", code: "6.2", displacementL: 6.2, fuel: "бензин" }, { name: "2.0 Turbo", code: "2.0", displacementL: 2, fuel: "бензин" }] }],
        }],
      },
      model("Silverado", "silverado", 2018, "Silverado 2018 используется тестовой карточкой колодок.", { name: "5.3 V8", code: "5.3", displacementL: 5.3, fuel: "бензин" }),
      model("Tahoe", "tahoe", 2019),
      model("Malibu", "malibu", 2019),
    ],
  },
  {
    name: "Dodge", slug: "dodge", country: "USA", featured: true,
    intro: "Dodge: тестовые карточки Charger и Challenger лежат рядом со справочными Durango.",
    models: [
      model("Charger", "charger", 2019, "Charger 2019 связан с тестовым блоком управления.", { name: "5.7 HEMI", code: "5.7", displacementL: 5.7, fuel: "бензин" }),
      model("Challenger", "challenger", 2020, "Challenger 2020 связан с тестовым диском колеса.", { name: "5.7 HEMI", code: "5.7", displacementL: 5.7, fuel: "бензин" }),
      model("Durango", "durango", 2019),
    ],
  },
  {
    name: "Jeep", slug: "jeep", country: "USA", featured: true,
    intro: "Jeep Wrangler JL 2018 и Grand Cherokee 2019 имеют тестовые кузов и рулевую рейку.",
    models: [
      model("Wrangler", "wrangler", 2018, "Wrangler JL 2018. Карточка бампера не распространяется на JK.", { name: "3.6 Pentastar", code: "3.6", displacementL: 3.6, fuel: "бензин" }),
      model("Grand Cherokee", "grand-cherokee", 2019, "Grand Cherokee 2019 связан с тестовой рулевой рейкой.", { name: "3.6 Pentastar", code: "3.6", displacementL: 3.6, fuel: "бензин" }),
    ],
  },
  { name: "Chrysler", slug: "chrysler", country: "USA", intro: "Chrysler 300 2018 используется тестовой карточкой панели приборов.", models: [model("300", "300", 2018, "Chrysler 300 2018: тестовая панель, комплектация кнопок не описана."), model("Pacifica", "pacifica", 2019)] },
  { name: "Cadillac", slug: "cadillac", country: "USA", intro: "Cadillac Escalade 2020 связан с тестовой карточкой модуля подушки.", models: [model("Escalade", "escalade", 2020, "Escalade 2020. Подушка в каталоге — тестовая запись, без инструкции по установке."), model("CTS", "cts", 2018)] },
  { name: "GMC", slug: "gmc", country: "USA", intro: "GMC Sierra 2019 связана с тестовым амортизатором.", models: [model("Sierra", "sierra", 2019, "Sierra 2019: тестовый амортизатор, ось указана в карточке."), model("Yukon", "yukon", 2019)] },
  { name: "Buick", slug: "buick", country: "USA", intro: "Buick Enclave 2018 связан с тестовой помпой.", models: [model("Enclave", "enclave", 2018, "Enclave 2018: тестовая помпа системы охлаждения."), model("Encore", "encore", 2019)] },
  { name: "Tesla", slug: "tesla", country: "USA", featured: true, intro: "Tesla Model 3 2021 связана с тестовым бампером. Наличие батареи эта карточка не описывает.", models: [model("Model 3", "model-3", 2021, "Model 3 2021: тестовый бампер, тип привода в карточке не указан.", { name: "Электропривод", code: "EV", fuel: "электро" }), model("Model Y", "model-y", 2021, undefined, { name: "Электропривод", code: "EV", fuel: "электро" })] },
  { name: "Lincoln", slug: "lincoln", country: "USA", intro: "Lincoln Navigator 2019 связан с тестовым сиденьем.", models: [model("Navigator", "navigator", 2019, "Navigator 2019: тестовое сиденье, электропривод не подтверждён."), model("Aviator", "aviator", 2020)] },
  {
    name: "RAM", slug: "ram", country: "USA", featured: true,
    intro: "RAM 1500 2019: тестовые раздатка и катализатор. Марка в справочнике отделена от Dodge.",
    models: [
      model("1500", "1500", 2019, "RAM 1500 поколения DT, 2019 год, мотор 5.7 в справочнике.", { name: "5.7 HEMI", code: "5.7", displacementL: 5.7, fuel: "бензин" }),
      model("2500", "2500", 2019),
    ],
  },
  { name: "Toyota", slug: "toyota", country: "Japan", featured: true, intro: "Toyota Camry 2019 связана с тестовыми тормозными дисками.", models: [model("Camry", "camry", 2019, "Camry 2019: тестовые передние диски, диаметр не измерен."), model("RAV4", "rav4", 2019), model("Tacoma", "tacoma", 2018)] },
  { name: "Honda", slug: "honda", country: "Japan", intro: "Honda Accord 2018 и Civic 2019 используются тестовыми стартером и дверью.", models: [model("Accord", "accord", 2018, "Accord 2018: тестовый стартер."), model("CR-V", "cr-v", 2019), model("Civic", "civic", 2019, "Civic 2019: тестовая дверь, сторона указана в карточке.")] },
  { name: "BMW", slug: "bmw", country: "Germany", featured: true, intro: "BMW 3 серии 2017 связана с тестовой фарой.", models: [model("3 Series", "3-series", 2017, "3 Series 2017: тестовая фара, сторона указана в характеристиках."), model("X5", "x5", 2019)] },
  { name: "Mercedes-Benz", slug: "mercedes-benz", country: "Germany", featured: true, intro: "Mercedes-Benz C-Class 2018 связан с тестовым рычагом подвески.", models: [model("C-Class", "c-class", 2018, "C-Class 2018: тестовый рычаг, ось указана в карточке."), model("E-Class", "e-class", 2018), model("GLE", "gle", 2019)] },
  { name: "Audi", slug: "audi", country: "Germany", intro: "Audi A4 2018 связана с тестовой форсункой без цены.", models: [model("A4", "a4", 2018, "A4 2018: тестовая форсунка. Цена в карточке намеренно пустая."), model("Q5", "q5", 2019)] },
  { name: "Volkswagen", slug: "volkswagen", country: "Germany", intro: "Volkswagen Jetta 2019 связана с тестовым топливным насосом.", models: [model("Jetta", "jetta", 2019, "Jetta 2019: тестовый насос, давление в характеристиках не указано."), model("Tiguan", "tiguan", 2019), model("Passat", "passat", 2018)] },
  { name: "Lexus", slug: "lexus", country: "Japan", intro: "Lexus RX 2018 связан с тестовым задним фонарём.", models: [model("RX", "rx", 2018, "RX 2018: тестовый фонарь, сторона указана в карточке."), model("ES", "es", 2019)] },
  { name: "Nissan", slug: "nissan", country: "Japan", intro: "Nissan Altima 2019 связана с тестовым крылом без остатка.", models: [model("Altima", "altima", 2019, "Altima 2019: тестовое крыло со статусом «нет в наличии»."), model("Rogue", "rogue", 2019), model("Pathfinder", "pathfinder", 2018)] },
  { name: "Hyundai", slug: "hyundai", country: "South Korea", intro: "Hyundai Sonata 2018 связана с тестовым комплектом ГРМ.", models: [model("Sonata", "sonata", 2018, "Sonata 2018: тестовый комплект ГРМ, ресурс ремня не указан."), model("Tucson", "tucson", 2019), model("Elantra", "elantra", 2019)] },
  { name: "Kia", slug: "kia", country: "South Korea", intro: "Kia Sportage 2020 связана с тестовым радиатором.", models: [model("Sportage", "sportage", 2020, "Sportage 2020: тестовый радиатор, объём системы не измерен."), model("Optima", "optima", 2018), model("Sorento", "sorento", 2019)] },
  { name: "Subaru", slug: "subaru", country: "Japan", intro: "Subaru Outback 2018 связан с тестовыми глушителем и ремнём.", models: [model("Outback", "outback", 2018, "Outback 2018: тестовые глушитель и ремень безопасности."), model("Forester", "forester", 2019), model("Impreza", "impreza", 2018)] },
];

type ProductSeed = {
  sku: string;
  slug: string;
  name: string;
  category: string;
  condition: ProductCondition;
  stockStatus: StockStatus;
  priceCents: number | null;
  quantity: number;
  backorder?: boolean;
  featured?: boolean;
  oem: string;
  manufacturer?: string;
  warranty?: string | null;
  delivery?: [number, number] | null;
  origin?: string | null;
  donor?: string | null;
  note: string;
  make: string;
  model: string;
  year: number;
  engine?: string;
  fitmentNote?: string;
  specs: [string, string][];
  daysAgo?: number;
};

const products: ProductSeed[] = [
  { sku: "TEST-MUST-HOOD-001", slug: "ford-mustang-2018-hood-oem-test-fr3z16612a", name: "Капот Ford Mustang 2018 (тест)", category: "hood", condition: "USED", stockStatus: "US_WAREHOUSE", priceCents: 48000, quantity: 1, featured: true, oem: "TEST-FR3Z16612A", origin: "USA", donor: "TEST-DONOR-1008", delivery: [21, 45], note: "Кузовная панель для S550 2018. Цвет и сколы в характеристиках не заполнены.", make: "ford", model: "mustang", year: 2018, engine: "5.0", fitmentNote: "Нужна сверка по VIN", specs: [["Положение", "перед"], ["Материал", "в карточке не подтверждён"], ["Цвет", "не указан"]], daysAgo: 2 },
  { sku: "TEST-MUST-ENG-001", slug: "ford-mustang-2018-engine-oem-test-fr3z6006e", name: "Двигатель Ford Mustang 2018 5.0 (тест)", category: "engine-assembly", condition: "USED", stockStatus: "ON_ORDER", priceCents: 320000, quantity: 0, backorder: true, featured: true, oem: "TEST-FR3Z6006E", origin: "USA", donor: "TEST-DONOR-1010", warranty: "Тестовая пометка: гарантия поставщиком не подтверждена", delivery: [30, 60], note: "Контрактный мотор 5.0. Пробег и список навесного не указаны намеренно.", make: "ford", model: "mustang", year: 2018, engine: "5.0", specs: [["Код", "5.0"], ["Комплектность", "не указана"], ["Пробег", "не указан"]], daysAgo: 1 },
  { sku: "TEST-MUST-HEAD-001", slug: "ford-mustang-2018-cylinder-head-oem-test-fr3z6049", name: "Головка блока Ford Mustang 2018 (тест)", category: "cylinder-head", condition: "USED", stockStatus: "US_WAREHOUSE", priceCents: 64000, quantity: 1, oem: "TEST-FR3Z6049A", origin: "USA", note: "Головка для тестового мотора 5.0. Клапаны и плоскость не измерялись.", make: "ford", model: "mustang", year: 2018, engine: "5.0", specs: [["Код двигателя", "5.0"], ["Ремонт плоскости", "не выполнялся в карточке"]], daysAgo: 6 },
  { sku: "TEST-MUST-CAL-001", slug: "ford-mustang-2018-brake-caliper-oem-test-fr3z2b712", name: "Суппорт Ford Mustang 2018 (тест)", category: "brake-caliper", condition: "REFURBISHED", stockStatus: "IN_STOCK", priceCents: 15500, quantity: 2, oem: "TEST-FR3Z2B712A", origin: "USA", warranty: "Тестовая гарантия: 30 дней, не оферта", note: "Восстановленный суппорт. Перечень заменённых пыльников в карточке не раскрыт.", make: "ford", model: "mustang", year: 2018, specs: [["Ось", "передняя"], ["Сторона", "правая"]], daysAgo: 4 },
  { sku: "TEST-MUST-RAD-001", slug: "ford-mustang-2018-radiator-oem-test-fr3z8005", name: "Радиатор Ford Mustang 2018 (тест)", category: "radiator", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 18900, quantity: 3, oem: "TEST-FR3Z8005A", origin: "USA", featured: true, note: "Новый радиатор тестовой линейки. Наличие АКПП-контура не указано.", make: "ford", model: "mustang", year: 2018, specs: [["Рядность", "не указана"], ["Крышка", "не входит"]], daysAgo: 8 },
  { sku: "TEST-MUST-MT-001", slug: "ford-mustang-2018-manual-gearbox-oem-test-mt82", name: "МКПП Ford Mustang 2018 (тест)", category: "manual-gearbox", condition: "USED", stockStatus: "US_WAREHOUSE", priceCents: 145000, quantity: 1, oem: "TEST-MT82-2018", origin: "USA", donor: "TEST-DONOR-1022", note: "Механическая коробка. Сцепление и маховик в комплект не заявлены.", make: "ford", model: "mustang", year: 2018, engine: "5.0", specs: [["Тип", "механика"], ["Сцепление", "не входит"]], daysAgo: 9 },
  { sku: "TEST-F150-ALT-001", slug: "ford-f150-2020-alternator-oem-test-gl3z10346", name: "Генератор Ford F-150 2020 (тест)", category: "alternator", condition: "REFURBISHED", stockStatus: "IN_STOCK", priceCents: 21000, quantity: 2, oem: "TEST-GL3Z10346A", origin: "USA", note: "Восстановленный генератор для F-150 2020. Ток в амперах не измерен.", make: "ford", model: "f-150", year: 2020, engine: "3.5", specs: [["Ток", "не указан"]], daysAgo: 5 },
  { sku: "TEST-F150-HIT-001", slug: "ford-f150-2020-hitch-oem-test-f150-hitch", name: "Фаркоп Ford F-150 2020 (тест)", category: "tow-hitch", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 27500, quantity: 2, oem: "TEST-F150-HITCH", origin: "USA", note: "Фаркоп тестовой поставки. Тяговый класс и электрика не указаны.", make: "ford", model: "f-150", year: 2020, specs: [["Электрика", "не входит"], ["Класс", "не указан"]], daysAgo: 12 },
  { sku: "TEST-CAM-HL-001", slug: "chevrolet-camaro-2019-headlight-oem-test-84234567", name: "Фара Chevrolet Camaro 2019 левая (тест)", category: "headlight", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 26500, quantity: 3, featured: true, oem: "TEST-84234567", origin: "USA", delivery: [14, 30], note: "Новая левая фара. Тип источника света не заявлен.", make: "chevrolet", model: "camaro", year: 2019, specs: [["Сторона", "левая"], ["Тип света", "не указан"]], daysAgo: 3 },
  { sku: "TEST-CAM-HOOD-001", slug: "chevrolet-camaro-2019-hood-oem-test-cam-hood", name: "Капот Chevrolet Camaro 2019 (тест)", category: "hood", condition: "USED", stockStatus: "IN_TRANSIT", priceCents: 51000, quantity: 1, oem: "TEST-CAM-HOOD", origin: "USA", note: "Капот в пути по статусу базы. Воздухозаборник не описан.", make: "chevrolet", model: "camaro", year: 2019, specs: [["Положение", "перед"], ["Воздухозаборник", "не указан"]], daysAgo: 7 },
  { sku: "TEST-CAM-AT-001", slug: "chevrolet-camaro-2019-gearbox-oem-test-cam-at", name: "АКПП Chevrolet Camaro 2019 (тест)", category: "automatic-gearbox", condition: "USED", stockStatus: "ON_ORDER", priceCents: 210000, quantity: 0, backorder: true, oem: "TEST-CAM-AT", origin: "USA", note: "Автомат под заказ. Гидротрансформатор в комплект не заявлен.", make: "chevrolet", model: "camaro", year: 2019, engine: "6.2", specs: [["Тип", "автомат"], ["Гидротрансформатор", "не заявлен"]], daysAgo: 11 },
  { sku: "TEST-SIL-PAD-001", slug: "chevrolet-silverado-2018-brake-pad-oem-test-19420000", name: "Колодки Chevrolet Silverado 2018 (тест)", category: "brake-pad", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 6400, quantity: 8, oem: "TEST-19420000", origin: "USA", note: "Комплект колодок одной оси. Датчик износа не упомянут и не обещан.", make: "chevrolet", model: "silverado", year: 2018, engine: "5.3", specs: [["Ось", "передняя"], ["Датчик", "не указан"]], daysAgo: 10 },
  { sku: "TEST-CHG-ECU-001", slug: "dodge-charger-2019-ecu-oem-test-chg-ecu", name: "Блок управления Dodge Charger 2019 (тест)", category: "ecu", condition: "USED", stockStatus: "US_WAREHOUSE", priceCents: 34000, quantity: 1, oem: "TEST-CHG-ECU", origin: "USA", note: "Б/у блок. Прошивка и иммобилайзер в карточке не описаны, привязка не обещана.", make: "dodge", model: "charger", year: 2019, engine: "5.7", specs: [["Прошивка", "не указана"]], daysAgo: 13 },
  { sku: "TEST-CHL-WHL-001", slug: "dodge-challenger-2020-wheel-oem-test-chl-whl", name: "Диск колеса Dodge Challenger 2020 (тест)", category: "alloy-wheel", condition: "USED", stockStatus: "IN_STOCK", priceCents: 18000, quantity: 4, oem: "TEST-CHL-WHL", origin: "USA", note: "Один диск. Вылет и ширина не измерены и не подставлены.", make: "dodge", model: "challenger", year: 2020, specs: [["Количество", "1"], ["Вылет", "не измерен"]], daysAgo: 14 },
  { sku: "TEST-JL-BMP-001", slug: "jeep-wrangler-2018-bumper-oem-test-jl-bmpr", name: "Бампер Jeep Wrangler 2018 JL (тест)", category: "bumper", condition: "USED", stockStatus: "US_WAREHOUSE", priceCents: 42000, quantity: 1, featured: true, oem: "TEST-JL-BMPR", origin: "USA", note: "Бампер JL, не JK. Лебёдка и калитка не входят.", make: "jeep", model: "wrangler", year: 2018, engine: "3.6", specs: [["Поколение", "JL"], ["Лебёдка", "не входит"]], daysAgo: 15 },
  { sku: "TEST-GC-RACK-001", slug: "jeep-grand-cherokee-2019-steering-rack-oem-test-gc-rack", name: "Рулевая рейка Jeep Grand Cherokee 2019 (тест)", category: "steering-rack", condition: "REFURBISHED", stockStatus: "IN_STOCK", priceCents: 36000, quantity: 1, oem: "TEST-GC-RACK", origin: "USA", note: "Восстановленная рейка. Тяги в комплект не заявлены.", make: "jeep", model: "grand-cherokee", year: 2019, engine: "3.6", specs: [["Тяги", "не входят"]], daysAgo: 16 },
  { sku: "TEST-300-DASH-001", slug: "chrysler-300-2018-dashboard-oem-test-300-dash", name: "Панель приборов Chrysler 300 2018 (тест)", category: "dashboard", condition: "USED", stockStatus: "ON_ORDER", priceCents: 29000, quantity: 0, backorder: true, oem: "TEST-300-DASH", origin: "USA", note: "Панель под заказ. Подушка в торпедо этой карточкой не продаётся.", make: "chrysler", model: "300", year: 2018, specs: [["Подушка", "не входит"]], daysAgo: 18 },
  { sku: "TEST-ESC-AB-001", slug: "cadillac-escalade-2020-airbag-oem-test-esc-ab", name: "Модуль подушки Cadillac Escalade 2020 (тест)", category: "airbag", condition: "USED", stockStatus: "US_WAREHOUSE", priceCents: 22000, quantity: 1, oem: "TEST-ESC-AB", origin: "USA", note: "Тестовая запись модуля. Инструкции по срабатыванию и установке нет: это каталожная карточка, не руководство.", make: "cadillac", model: "escalade", year: 2020, specs: [["Место", "руль"], ["Срабатывание", "не проверялось"]], daysAgo: 19 },
  { sku: "TEST-SIE-SHK-001", slug: "gmc-sierra-2019-shock-oem-test-sie-shk", name: "Амортизатор GMC Sierra 2019 (тест)", category: "shock-absorber", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 8900, quantity: 4, oem: "TEST-SIE-SHK", origin: "USA", note: "Один амортизатор передней оси. Пружина отдельно.", make: "gmc", model: "sierra", year: 2019, specs: [["Ось", "передняя"], ["Пружина", "не входит"]], daysAgo: 20 },
  { sku: "TEST-ENC-WP-001", slug: "buick-enclave-2018-water-pump-oem-test-encl-wp", name: "Помпа Buick Enclave 2018 (тест)", category: "water-pump", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 7400, quantity: 2, oem: "TEST-ENCL-WP", origin: "USA", note: "Новая помпа. Прокладка в комплект не заявлена.", make: "buick", model: "enclave", year: 2018, specs: [["Прокладка", "не входит"]], daysAgo: 21 },
  { sku: "TEST-M3-BMP-001", slug: "tesla-model-3-2021-bumper-oem-test-m3-bmp", name: "Бампер Tesla Model 3 2021 (тест)", category: "bumper", condition: "USED", stockStatus: "IN_TRANSIT", priceCents: 39000, quantity: 1, oem: "TEST-M3-BMP", origin: "USA", note: "Бампер Model 3. Парктроники и камера в комплекте не подтверждены.", make: "tesla", model: "model-3", year: 2021, engine: "EV", specs: [["Парктроники", "не подтверждены"]], daysAgo: 17 },
  { sku: "TEST-NAV-SEAT-001", slug: "lincoln-navigator-2019-seat-oem-test-nav-seat", name: "Сиденье Lincoln Navigator 2019 (тест)", category: "seat", condition: "USED", stockStatus: "US_WAREHOUSE", priceCents: 45000, quantity: 1, oem: "TEST-NAV-SEAT", origin: "USA", note: "Одно сиденье. Электропривод и обивка описаны как неизвестные.", make: "lincoln", model: "navigator", year: 2019, specs: [["Ряд", "передний"], ["Привод", "не указан"]], daysAgo: 22 },
  { sku: "TEST-RAM-TC-001", slug: "ram-1500-2019-transfer-case-oem-test-68200000", name: "Раздатка RAM 1500 2019 (тест)", category: "transfer-case", condition: "USED", stockStatus: "IN_TRANSIT", priceCents: 89000, quantity: 1, featured: true, oem: "TEST-68200000", origin: "USA", donor: "TEST-DONOR-1500", delivery: [20, 40], note: "Раздатка для полного привода. Заднеприводную версию этой карточкой не закрываем.", make: "ram", model: "1500", year: 2019, engine: "5.7", fitmentNote: "Только полный привод", specs: [["Привод", "полный"], ["Масло", "не залито в описании"]], daysAgo: 4 },
  { sku: "TEST-RAM-CAT-001", slug: "ram-1500-2019-catalytic-oem-test-ram-cat", name: "Каталитический нейтрализатор RAM 1500 2019 (тест)", category: "catalytic-converter", condition: "USED", stockStatus: "US_WAREHOUSE", priceCents: 31000, quantity: 1, oem: "TEST-RAM-CAT", origin: "USA", note: "Замена нейтрализатора. Карточка не описывает удаление контроля выбросов. Норма EPA в характеристиках не указана.", make: "ram", model: "1500", year: 2019, specs: [["Норма", "не указана"], ["Назначение", "замена узла"]], daysAgo: 23 },
  { sku: "TEST-CAMRY-DISC-001", slug: "toyota-camry-2019-brake-disc-oem-test-43512000", name: "Тормозной диск Toyota Camry 2019 (тест)", category: "brake-disc", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 7400, quantity: 8, featured: true, oem: "TEST-43512000", origin: "USA", note: "Передний диск, одна штука. Диаметр не измерен.", make: "toyota", model: "camry", year: 2019, specs: [["Ось", "передняя"], ["В комплекте", "1"], ["Диаметр", "не измерен"]], daysAgo: 6 },
  { sku: "TEST-CAMRY-DISC-002", slug: "toyota-camry-2019-brake-disc-oem-test-43512001", name: "Тормозной диск Toyota Camry 2019 восстановленный (тест)", category: "brake-disc", condition: "REFURBISHED", stockStatus: "IN_STOCK", priceCents: 5200, quantity: 2, oem: "TEST-43512001", origin: "USA", note: "Восстановленный аналог переднего диска. Толщина после проточки не указана.", make: "toyota", model: "camry", year: 2019, specs: [["Ось", "передняя"], ["Толщина", "не указана"]], daysAgo: 24 },
  { sku: "TEST-ACC-STR-001", slug: "honda-accord-2018-starter-oem-test-acc-str", name: "Стартер Honda Accord 2018 (тест)", category: "starter", condition: "REFURBISHED", stockStatus: "IN_STOCK", priceCents: 9800, quantity: 2, oem: "TEST-ACC-STR", origin: "USA", note: "Восстановленный стартер. Число зубьев бендикса не указано.", make: "honda", model: "accord", year: 2018, specs: [["Зубья", "не указаны"]], daysAgo: 25 },
  { sku: "TEST-CIV-DOOR-001", slug: "honda-civic-2019-door-oem-test-civ-door", name: "Дверь Honda Civic 2019 (тест)", category: "door", condition: "USED", stockStatus: "US_WAREHOUSE", priceCents: 36000, quantity: 1, oem: "TEST-CIV-DOOR", origin: "USA", note: "Передняя левая дверь. Стекло и карта в комплект не заявлены.", make: "honda", model: "civic", year: 2019, specs: [["Сторона", "левая"], ["Стекло", "не входит"]], daysAgo: 26 },
  { sku: "TEST-F30-HL-001", slug: "bmw-3-series-2017-headlight-oem-test-f30-hl", name: "Фара BMW 3 серии 2017 (тест)", category: "headlight", condition: "USED", stockStatus: "IN_STOCK", priceCents: 24000, quantity: 1, oem: "TEST-F30-HL", origin: "USA", note: "Правая фара. Блок розжига отдельно не обещан.", make: "bmw", model: "3-series", year: 2017, specs: [["Сторона", "правая"], ["Розжиг", "не входит"]], daysAgo: 27 },
  { sku: "TEST-C-ARM-001", slug: "mercedes-c-class-2018-control-arm-oem-test-c-arm", name: "Рычаг Mercedes-Benz C-Class 2018 (тест)", category: "control-arm", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 11200, quantity: 2, oem: "TEST-C-ARM", origin: "USA", note: "Нижний рычаг. Сайлентблоки как отдельные позиции не расшифрованы.", make: "mercedes-benz", model: "c-class", year: 2018, specs: [["Ось", "передняя"], ["Положение", "нижний"]], daysAgo: 28 },
  { sku: "TEST-A4-INJ-001", slug: "audi-a4-2018-injector-oem-test-a4-inj", name: "Форсунка Audi A4 2018 (тест)", category: "injector", condition: "NEW", stockStatus: "ON_ORDER", priceCents: null, quantity: 0, backorder: true, oem: "TEST-A4-INJ", origin: "USA", note: "Цена намеренно не задана. Кнопки покупки нет, пока сотрудник не внесёт цену.", make: "audi", model: "a4", year: 2018, specs: [["Цена", "не задана"], ["Производительность", "не указана"]], daysAgo: 29 },
  { sku: "TEST-JET-FP-001", slug: "volkswagen-jetta-2019-fuel-pump-oem-test-jetta-fp", name: "Топливный насос Volkswagen Jetta 2019 (тест)", category: "fuel-pump", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 8600, quantity: 3, oem: "TEST-JETTA-FP", origin: "USA", note: "Насос в баке. Давление в барах не указано.", make: "volkswagen", model: "jetta", year: 2019, specs: [["Давление", "не указано"]], daysAgo: 30 },
  { sku: "TEST-RX-TL-001", slug: "lexus-rx-2018-taillight-oem-test-rx-tail", name: "Фонарь Lexus RX 2018 (тест)", category: "taillight", condition: "USED", stockStatus: "IN_STOCK", priceCents: 13200, quantity: 1, oem: "TEST-RX-TAIL", origin: "USA", note: "Левый внешний фонарь. Проводка багажника не входит.", make: "lexus", model: "rx", year: 2018, specs: [["Сторона", "левая"], ["Часть", "внешняя"]], daysAgo: 31 },
  { sku: "TEST-ALT-FND-001", slug: "nissan-altima-2019-fender-oem-test-alt-fnd", name: "Крыло Nissan Altima 2019 (тест)", category: "fender", condition: "USED", stockStatus: "OUT_OF_STOCK", priceCents: 15000, quantity: 0, oem: "TEST-ALT-FND", origin: "USA", note: "Остаток нулевой, статус «нет в наличии». Купить нельзя, пока статус не изменят.", make: "nissan", model: "altima", year: 2019, specs: [["Сторона", "правая"], ["Остаток", "0"]], daysAgo: 32 },
  { sku: "TEST-SON-TIM-001", slug: "hyundai-sonata-2018-timing-oem-test-son-tim", name: "Комплект ГРМ Hyundai Sonata 2018 (тест)", category: "timing-kit", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 15400, quantity: 2, oem: "TEST-SON-TIM", origin: "USA", note: "Комплект ГРМ. Помпа в набор не включена, это отдельная категория.", make: "hyundai", model: "sonata", year: 2018, specs: [["Помпа", "не входит"], ["Ремень или цепь", "не уточнено производителем теста"]], daysAgo: 33 },
  { sku: "TEST-SPT-RAD-001", slug: "kia-sportage-2020-radiator-oem-test-spt-rad", name: "Радиатор Kia Sportage 2020 (тест)", category: "radiator", condition: "NEW", stockStatus: "IN_STOCK", priceCents: 12100, quantity: 2, oem: "TEST-SPT-RAD", origin: "USA", note: "Радиатор Sportage. Объём системы охлаждения не измерен.", make: "kia", model: "sportage", year: 2020, specs: [["Объём", "не измерен"]], daysAgo: 34 },
  { sku: "TEST-OUT-MUF-001", slug: "subaru-outback-2018-muffler-oem-test-out-muf", name: "Глушитель Subaru Outback 2018 (тест)", category: "muffler", condition: "USED", stockStatus: "US_WAREHOUSE", priceCents: 9800, quantity: 1, oem: "TEST-OUT-MUF", origin: "USA", note: "Задняя банка. Труба и хомуты не входят.", make: "subaru", model: "outback", year: 2018, specs: [["Часть", "задняя банка"], ["Хомуты", "не входят"]], daysAgo: 35 },
  { sku: "TEST-OUT-BELT-001", slug: "subaru-outback-2018-seatbelt-oem-test-out-belt", name: "Ремень безопасности Subaru Outback 2018 (тест)", category: "seatbelt", condition: "USED", stockStatus: "IN_STOCK", priceCents: 4500, quantity: 1, oem: "TEST-OUT-BELT", origin: "USA", note: "Передний левый ремень. Пиропатрон отдельно не описан.", make: "subaru", model: "outback", year: 2018, specs: [["Место", "передний левый"], ["Пиропатрон", "не описан"]], daysAgo: 36 },
];

function svg(name: string, sku: string) {
  const safe = (value: string) => value.replace(/[<>&]/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#eef2f6"/>
  <rect x="36" y="36" width="728" height="528" rx="18" fill="#ffffff" stroke="#0c2340" stroke-width="3"/>
  <text x="64" y="120" font-family="Arial,sans-serif" font-size="22" fill="#e4570e">ТЕСТОВАЯ СХЕМА</text>
  <text x="64" y="180" font-family="Arial,sans-serif" font-size="28" fill="#0c2340">${safe(name).slice(0, 48)}</text>
  <text x="64" y="230" font-family="Arial,sans-serif" font-size="18" fill="#243140">${safe(sku)}</text>
  <text x="64" y="290" font-family="Arial,sans-serif" font-size="16" fill="#5c6b7a">Это не фотография товара.</text>
  <rect x="64" y="350" width="250" height="130" fill="#0c2340"/>
  <rect x="334" y="350" width="170" height="130" fill="#e4570e"/>
  <rect x="524" y="350" width="180" height="130" fill="#d5dde6"/>
</svg>`;
}

async function main() {
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`SELECT setval('order_number_seq', 1, false)`);

  const settings: Record<string, string> = {
    companyName: "USAPARTS",
    phone: "+1 (000) 000-0000",
    email: "hello@usaparts.example",
    telegram: "https://t.me/usaparts_demo",
    whatsapp: "https://wa.me/10000000000",
    address: "Демонстрационный адрес не опубликован",
    hours: "Ответ менеджера зависит от графика смены, круглосуточный колл-центр не заявлен",
    demoMode: "true",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.create({ data: { key, value } });
  }
  const templates = [
    ["product", "{name} | USAPARTS", "{name}. Артикул {sku}, OEM {oem}. Состояние: {condition}. Наличие: {stock}."],
    ["category", "{name} — автозапчасти из США | USAPARTS", "Категория «{name}». В базе {count} опубликованных позиций."],
    ["brand", "Запчасти {name} из США | USAPARTS", "Запчасти {name}. В базе {count} позиций с этой маркой."],
    ["model", "Запчасти {make} {model} | USAPARTS", "Запчасти {make} {model}. В базе {count} совместимых позиций."],
    ["year", "Запчасти {make} {model} {year} | USAPARTS", "Запчасти {make} {model} {year}. В базе {count} позиций этого года."],
    ["fitment", "{category} для {make} {model} {year} | USAPARTS", "{category} для {make} {model} {year}: {count} позиций из базы."],
  ] as const;
  for (const [key, titleTemplate, descriptionTemplate] of templates) {
    await prisma.seoTemplate.create({ data: { key, titleTemplate, descriptionTemplate } });
  }

  const password = {
    admin: await hash("ChangeMe_Admin1", 10),
    manager: await hash("ChangeMe_Manager1", 10),
    content: await hash("ChangeMe_Content1", 10),
  };
  const admin = await prisma.user.create({ data: { email: "admin@usaparts.test", name: "Администратор демо", passwordHash: password.admin, role: "ADMIN" } });
  await prisma.user.create({ data: { email: "manager@usaparts.test", name: "Менеджер демо", passwordHash: password.manager, role: "MANAGER" } });
  await prisma.user.create({ data: { email: "content@usaparts.test", name: "Контент демо", passwordHash: password.content, role: "CONTENT" } });

  await prisma.coupon.create({ data: { code: "TEST10", type: "PERCENT", amount: 10, note: "Демонстрационный промокод на 10%. Не публичная акция." } });
  await prisma.deliveryMethod.create({ data: { code: "manager", name: "Подтверждение менеджером", description: "Стоимость международной доставки здесь не рассчитывается.", priceCents: null, adapter: "manual", adapterStatus: "manual" } });
  await prisma.deliveryMethod.create({ data: { code: "carrier", name: "Служба доставки", description: "Появится после DELIVERY_PROVIDER.", adapter: "carrier", adapterStatus: "not_connected", isActive: false } });
  await prisma.paymentMethod.create({ data: { code: "manager", name: "Оплата через менеджера", adapter: "none", adapterStatus: "not_connected" } });
  await prisma.promotion.create({ data: { title: "Черновик акции", body: "Не показывается на витрине, пока isActive выключен.", isActive: false } });

  const categoryIds = new Map<string, string>();
  const tree: { slug: string; name: string; intro: string; children: { slug: string; name: string; intro: string }[] }[] = [
    { slug: "engine", name: "Двигатель", intro: "Блок, головка и привод ГРМ. Комплектность читайте в карточке: общий текст категории её не гарантирует.", children: [
      { slug: "engine-assembly", name: "Двигатель в сборе", intro: "Контрактный или новый агрегат. Пробег есть только если он записан в характеристиках." },
      { slug: "cylinder-head", name: "Головка блока", intro: "Головка без обещания ремонта плоскости, пока это не написано в карточке." },
      { slug: "timing-kit", name: "ГРМ", intro: "Ремень или цепь. Помпа входит только когда это сказано отдельно." },
    ] },
    { slug: "transmission", name: "КПП и трансмиссия", intro: "Автомат, механика и раздатка разведены по подкатегориям и не подменяют друг друга.", children: [
      { slug: "automatic-gearbox", name: "АКПП", intro: "Гидротрансформатор не предполагается в комплекте без явной строки." },
      { slug: "manual-gearbox", name: "МКПП", intro: "Сцепление и маховик проверяйте отдельной строкой характеристик." },
      { slug: "torque-converter", name: "Гидротрансформатор", intro: "Отдельный узел, не часть карточки АКПП по умолчанию." },
      { slug: "transfer-case", name: "Раздаточная коробка", intro: "Для полного привода. Задний привод этой подкатегорией не закрывается." },
    ] },
    { slug: "suspension", name: "Подвеска", intro: "Амортизаторы, рычаги и пружины. Ось указана в карточке, не в заголовке категории.", children: [
      { slug: "shock-absorber", name: "Амортизаторы", intro: "Один амортизатор, если в характеристиках не написано иное." },
      { slug: "control-arm", name: "Рычаги", intro: "Сторона и ось обязательны для заказа. Пустое поле — повод спросить." },
      { slug: "spring", name: "Пружины", intro: "Пружина не входит в амортизатор автоматически." },
    ] },
    { slug: "steering", name: "Рулевое управление", intro: "Рейки и тяги. Углы установки сайт не назначает.", children: [
      { slug: "steering-rack", name: "Рулевая рейка", intro: "Тяги и пыльники входят только при явной комплектации." },
      { slug: "tie-rod", name: "Рулевые тяги", intro: "Наконечник и тяга могут иметь разные номера." },
    ] },
    { slug: "brakes", name: "Тормозная система", intro: "Диски, колодки и суппорты по оси. Диаметр не выдумывается, если его не измерили.", children: [
      { slug: "brake-disc", name: "Тормозные диски", intro: "Ось и количество штук смотрите в характеристиках." },
      { slug: "brake-pad", name: "Колодки", intro: "Датчик износа входит только если он назван." },
      { slug: "brake-caliper", name: "Суппорты", intro: "Сторона суппорта обязательна." },
    ] },
    { slug: "body-parts", name: "Кузовные детали", intro: "Капот, крыло, бампер и дверь привязаны к поколению, не ко всей марке.", children: [
      { slug: "hood", name: "Капоты", intro: "Цвет не обещан, пока в характеристиках нет кода окраски." },
      { slug: "fender", name: "Крылья", intro: "Левое и правое — разные карточки." },
      { slug: "bumper", name: "Бамперы", intro: "Усилитель, решётка и парктроники не входят молча." },
      { slug: "door", name: "Двери", intro: "Стекло и обшивка указываются отдельно." },
    ] },
    { slug: "lighting", name: "Оптика", intro: "Фары и фонари со стороной. Тип света не додумывается по корпусу.", children: [
      { slug: "headlight", name: "Фары", intro: "Сторона и блок розжига — отдельные факты карточки." },
      { slug: "taillight", name: "Задние фонари", intro: "Внешняя и внутренняя части могут иметь разные номера." },
    ] },
    { slug: "electrical", name: "Электрика", intro: "Генератор, стартер и блоки. Прошивка блока не обещается без строки в карточке.", children: [
      { slug: "alternator", name: "Генераторы", intro: "Ток в амперах публикуется только после измерения." },
      { slug: "starter", name: "Стартеры", intro: "Число зубьев не подставляется из соседней модели." },
      { slug: "ecu", name: "Блоки управления", intro: "Иммобилайзер и прошивка требуют отдельного подтверждения." },
    ] },
    { slug: "cooling", name: "Система охлаждения", intro: "Радиатор и помпа. Объём системы не оценивается навскидку.", children: [
      { slug: "radiator", name: "Радиаторы", intro: "Контур АКПП входит только если он назван." },
      { slug: "water-pump", name: "Помпы", intro: "Прокладка может быть отдельной позицией." },
    ] },
    { slug: "fuel", name: "Топливная система", intro: "Насос и форсунки. Давление публикуется только если оно есть в характеристиках.", children: [
      { slug: "fuel-pump", name: "Топливные насосы", intro: "Модуль в баке и подвесной насос не смешиваются." },
      { slug: "injector", name: "Форсунки", intro: "Без цены карточка не попадает в корзину." },
    ] },
    { slug: "interior", name: "Салон", intro: "Сиденья и панели. Электропривод и подушки внутри панели не предполагаются.", children: [
      { slug: "seat", name: "Сиденья", intro: "Одно место, если не написано «комплект»." },
      { slug: "dashboard", name: "Панель приборов", intro: "Подушка торпедо этой подкатегорией не продаётся." },
    ] },
    { slug: "safety", name: "Элементы безопасности", intro: "Подушки и ремни как каталожные позиции. Руководства по раскрытию нет.", children: [
      { slug: "airbag", name: "Подушки безопасности", intro: "Модуль без инструкции установки. Совместимость сверяют по VIN." },
      { slug: "seatbelt", name: "Ремни", intro: "Место установки указано в характеристиках." },
    ] },
    { slug: "exhaust", name: "Выхлопная система", intro: "Глушитель и нейтрализатор как запчасти замены, без советов обходить контроль выбросов.", children: [
      { slug: "muffler", name: "Глушители", intro: "Хомуты и трубы не входят, пока это не сказано." },
      { slug: "catalytic-converter", name: "Каталитические нейтрализаторы", intro: "Норма токсичности указывается только если она известна." },
    ] },
    { slug: "wheels", name: "Колёса и диски", intro: "Диск без вылета не считается подобранным.", children: [
      { slug: "alloy-wheel", name: "Литые диски", intro: "Вылет, ширина и число отверстий обязательны, когда известны." },
    ] },
    { slug: "accessories", name: "Навесное оборудование", intro: "Фаркопы и крепёж. Тяговый класс не назначается категорией.", children: [
      { slug: "tow-hitch", name: "Фаркопы", intro: "Электрика розетки входит только по строке характеристик." },
    ] },
  ];
  for (const [index, category] of tree.entries()) {
    const parent = await prisma.category.create({ data: { name: category.name, slug: category.slug, intro: category.intro, sortOrder: index } });
    categoryIds.set(category.slug, parent.id);
    for (const [childIndex, child] of category.children.entries()) {
      const created = await prisma.category.create({ data: { name: child.name, slug: child.slug, intro: child.intro, parentId: parent.id, sortOrder: childIndex } });
      categoryIds.set(child.slug, created.id);
    }
  }

  const makeIds = new Map<string, string>();
  const modelIds = new Map<string, string>();
  const yearIds = new Map<string, string>();
  const generationIds = new Map<string, string>();
  const engineIds = new Map<string, string>();
  for (const [index, make] of makes.entries()) {
    const createdMake = await prisma.vehicleMake.create({
      data: { name: make.name, slug: make.slug, country: make.country, intro: make.intro, isFeatured: Boolean(make.featured), sortOrder: index },
    });
    makeIds.set(make.slug, createdMake.id);
    for (const item of make.models) {
      const createdModel = await prisma.vehicleModel.create({ data: { makeId: createdMake.id, name: item.name, slug: item.slug, intro: item.intro } });
      modelIds.set(`${make.slug}:${item.slug}`, createdModel.id);
      for (const generation of item.generations) {
        const createdGeneration = await prisma.vehicleGeneration.create({
          data: { modelId: createdModel.id, name: generation.name, slug: generation.slug, yearFrom: generation.yearFrom, yearTo: generation.yearTo },
        });
        generationIds.set(`${createdModel.id}:${generation.slug}`, createdGeneration.id);
        for (const year of generation.years) {
          const createdYear = await prisma.vehicleYear.create({ data: { generationId: createdGeneration.id, year: year.year } });
          yearIds.set(`${createdModel.id}:${year.year}`, createdYear.id);
          generationIds.set(`${createdModel.id}:${year.year}`, createdGeneration.id);
          for (const engine of year.engines) {
            const createdEngine = await prisma.engine.create({
              data: { yearId: createdYear.id, name: engine.name, code: engine.code, fuel: engine.fuel, displacementL: engine.displacementL },
            });
            engineIds.set(`${createdYear.id}:${engine.code}`, createdEngine.id);
          }
        }
      }
    }
  }

  await mkdir(path.join(process.cwd(), "storage/demo"), { recursive: true });
  const productIds = new Map<string, string>();
  for (const item of products) {
    const categoryId = categoryIds.get(item.category);
    const makeId = makeIds.get(item.make);
    const modelId = modelIds.get(`${item.make}:${item.model}`);
    if (!categoryId || !makeId || !modelId) throw new Error(`Нет справочника для ${item.sku}`);
    const yearId = yearIds.get(`${modelId}:${item.year}`);
    const generationId = generationIds.get(`${modelId}:${item.year}`);
    if (!yearId || !generationId) throw new Error(`Нет года ${item.year} для ${item.sku}`);
    const engineId = item.engine ? engineIds.get(`${yearId}:${item.engine}`) : undefined;
    if (item.engine && !engineId) throw new Error(`Нет двигателя ${item.engine} для ${item.sku}`);
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    const description = `Тестовая карточка ${item.sku}. ${item.note} Цена, остаток и срок записаны в базе как демонстрационные и не являются офертой.`;
    const created = await prisma.product.create({
      data: {
        sku: item.sku,
        slug: item.slug,
        name: item.name,
        categoryId,
        condition: item.condition,
        stockStatus: item.stockStatus,
        priceCents: item.priceCents,
        quantity: item.quantity,
        allowBackorder: Boolean(item.backorder),
        isPublished: true,
        isDemo: true,
        isFeatured: Boolean(item.featured),
        indexable: true,
        manufacturer: "Тестовый производитель",
        warranty: item.warranty ?? null,
        deliveryMinDays: item.delivery?.[0] ?? null,
        deliveryMaxDays: item.delivery?.[1] ?? null,
        originCountry: item.origin ?? null,
        donorStockNumber: item.donor ?? null,
        description,
        searchText: buildSearchText([item.name, item.sku, item.oem, item.make, item.model, String(item.year), category?.name, "тестовый производитель"]),
        createdAt: new Date(Date.now() - (item.daysAgo ?? 3) * 86_400_000),
        oemNumbers: { create: [{ number: item.oem, normalized: normalizeOem(item.oem), isPrimary: true }] },
        specs: { create: item.specs.map(([name, value], order) => ({ name, value, sortOrder: order })) },
        compatibilities: {
          create: [{
            makeId,
            modelId,
            generationId,
            year: item.year,
            engineId,
            note: item.fitmentNote,
          }],
        },
        inventory: {
          create: [{
            warehouse: item.stockStatus === "US_WAREHOUSE" ? "US" : item.stockStatus === "IN_TRANSIT" ? "TRANSIT" : "LOCAL",
            quantity: item.quantity,
          }],
        },
      },
    });
    productIds.set(item.sku, created.id);
    const key = `demo/${item.sku.toLowerCase()}.svg`;
    await writeFile(path.join(process.cwd(), "storage", key), svg(item.name, item.sku));
    await prisma.productImage.create({
      data: {
        productId: created.id,
        storageKey: key,
        alt: `Тестовая схема: ${item.name}. Не фотография товара.`,
        width: 800,
        height: 600,
        mimeType: "image/svg+xml",
      },
    });
  }

  async function relate(from: string, to: string, type: string) {
    await prisma.productRelation.create({ data: { fromId: productIds.get(from)!, toId: productIds.get(to)!, type } });
  }
  await relate("TEST-CAMRY-DISC-001", "TEST-CAMRY-DISC-002", "ANALOG");
  await relate("TEST-CAMRY-DISC-002", "TEST-CAMRY-DISC-001", "ANALOG");
  await relate("TEST-MUST-HOOD-001", "TEST-CAM-HOOD-001", "SIMILAR");
  await relate("TEST-CAM-HOOD-001", "TEST-MUST-HOOD-001", "SIMILAR");
  await relate("TEST-MUST-HOOD-001", "TEST-MUST-CAL-001", "RELATED");
  await relate("TEST-CAM-HL-001", "TEST-F30-HL-001", "SIMILAR");

  const reviewTargets = [
    ["TEST-MUST-HOOD-001", "Тестовый покупатель А.", "Проверка карточки капота: цена и склад отобразились из базы. Это не опыт реальной доставки."],
    ["TEST-CAM-HL-001", "Тестовый покупатель Б.", "На фаре видна сторона. Отзыв создан для вёрстки и помечен как тестовый."],
    ["TEST-CAMRY-DISC-001", "Тестовый покупатель В.", "Диск без выдуманного диаметра. Текст нужен только чтобы проверить блок отзывов."],
    ["TEST-RAM-TC-001", "Тестовый покупатель Г.", "Статус «в пути» у раздатки читается отдельно от статуса заказа. Реального трека нет."],
  ] as const;
  for (const [sku, authorName, body] of reviewTargets) {
    await prisma.review.create({
      data: { productId: productIds.get(sku), authorName, rating: 5, body, isDemo: true, status: "PUBLISHED" },
    });
  }

  for (const category of articleCategories) {
    await prisma.articleCategory.create({ data: category });
  }
  for (const article of articles) {
    const category = await prisma.articleCategory.findUnique({ where: { slug: article.category } });
    await prisma.article.create({
      data: {
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        categoryId: category?.id,
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date("2026-10-01T00:00:00Z"),
        faqs: article.faqs ? { create: article.faqs.map((faq, index) => ({ ...faq, sortOrder: index })) } : undefined,
      },
    });
  }
  for (const page of pages) await prisma.page.create({ data: { ...page, isPublished: true } });
  for (const landing of landings) {
    await prisma.landingPage.create({
      data: {
        slug: landing.slug,
        h1: landing.h1,
        body: landing.body,
        seoTitle: landing.seoTitle,
        seoDescription: landing.seoDescription,
        indexable: true,
        isPublished: true,
        makeSlug: landing.makeSlug,
        modelSlug: landing.modelSlug,
        year: landing.year,
        categorySlug: landing.categorySlug,
        products: { create: landing.skus.map((sku) => ({ productId: productIds.get(sku)! })) },
      },
    });
  }
  await prisma.slugTombstone.create({
    data: { path: "/product/test-removed-starter", httpStatus: 410, note: "Демонстрационный адрес снятой карточки" },
  });
  console.log(`Seeded ${products.length} demo products`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
