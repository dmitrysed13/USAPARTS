export type AnalyticsEvent =
  | "form_submit"
  | "phone_click"
  | "messenger_click"
  | "callback_click"
  | "quote_click"
  | "form_start";

type Params = Record<string, string>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    ym?: (id: number, method: string, goal: string, params?: Params) => void;
  }
}

function counterId(): number | null {
  const raw = import.meta.env.VITE_YM_COUNTER_ID;
  if (typeof raw !== "string" || !/^\d{4,12}$/.test(raw)) return null;
  return Number(raw);
}

export function track(event: AnalyticsEvent, params: Params = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
  if (typeof window.gtag === "function") window.gtag("event", event, params);
  const metrika = counterId();
  if (metrika && typeof window.ym === "function") window.ym(metrika, "reachGoal", event, params);
}

export function installAnalytics() {
  const ga = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (typeof ga === "string" && /^G-[A-Z0-9]+$/.test(ga) && !document.querySelector(`script[data-analytics="ga"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
    script.dataset.analytics = "ga";
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", ga);
  }

  const metrika = counterId();
  if (metrika && !document.querySelector(`script[data-analytics="ym"]`)) {
    const loader = document.createElement("script");
    loader.async = true;
    loader.src = "https://mc.yandex.ru/metrika/tag.js";
    loader.dataset.analytics = "ym";
    document.head.appendChild(loader);
    const setup = document.createElement("script");
    setup.text = `window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};window.ym.l=Date.now();ym(${metrika},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});`;
    document.head.appendChild(setup);
  }
}
