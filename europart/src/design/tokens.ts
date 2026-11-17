export const palette = [
  { name: "Красный", cssVariable: "--brand", hex: "#d0121a", ink: "#ffffff" },
  {
    name: "Красный тёмный",
    cssVariable: "--brand-strong",
    hex: "#a50e14",
    ink: "#ffffff",
  },
  { name: "Красный мягкий", cssVariable: "--brand-soft", hex: "#fdeced", ink: "#121417" },
  { name: "Текст", cssVariable: "--ink", hex: "#121417", ink: "#ffffff" },
  { name: "Текст вторичный", cssVariable: "--ink-muted", hex: "#5c6370", ink: "#ffffff" },
  { name: "Фон", cssVariable: "--surface", hex: "#ffffff", ink: "#121417" },
  {
    name: "Фон карточек",
    cssVariable: "--surface-muted",
    hex: "#f4f5f7",
    ink: "#121417",
  },
  { name: "Линии", cssVariable: "--line", hex: "#e4e7ec", ink: "#121417" },
  { name: "Тёмная панель", cssVariable: "--panel", hex: "#17191d", ink: "#f5f6f8" },
  {
    name: "Панель вторичная",
    cssVariable: "--panel-muted",
    hex: "#2a2e35",
    ink: "#f5f6f8",
  },
  {
    name: "Текст на панели",
    cssVariable: "--panel-foreground",
    hex: "#f5f6f8",
    ink: "#121417",
  },
  { name: "Успех", cssVariable: "--success", hex: "#0f7a45", ink: "#ffffff" },
  { name: "Внимание", cssVariable: "--warning", hex: "#9a6700", ink: "#ffffff" },
  { name: "Ошибка", cssVariable: "--danger", hex: "#b42318", ink: "#ffffff" },
] as const;

export const typeScale = [
  {
    name: "Экран",
    sample: "Автозапчасти",
    className: "font-display text-5xl font-semibold tracking-tight",
  },
  {
    name: "Заголовок",
    sample: "Подбор по автомобилю",
    className: "font-display text-3xl font-semibold tracking-tight",
  },
  {
    name: "Раздел",
    sample: "Тормозная система",
    className: "font-display text-2xl font-semibold",
  },
  {
    name: "Текст",
    sample: "Новые и контрактные запчасти с доставкой по Беларуси.",
    className: "text-base leading-7",
  },
  {
    name: "Подпись",
    sample: "Артикул и OEM",
    className: "text-sm leading-5 text-ink-muted",
  },
] as const;
