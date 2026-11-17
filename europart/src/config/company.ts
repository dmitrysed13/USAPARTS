/**
 * Public company facts. Legal address currently mirrors europart.by (Brest)
 * until the owner confirms a Minsk presence. Market positioning is Belarus,
 * Minsk-first for SEO/delivery messaging — without inventing a Minsk storefront.
 */
export const company = {
  brand: "EUROPART",
  legalName: "ООО «БелТРЭК»",
  city: "Брест",
  streetAddress: "ул. Московская, 364",
  country: "Беларусь",
  marketFocus: "Беларусь · Минск-first",
  phoneDisplay: "+375 29 792 07 86",
  phoneTel: "+375297920786",
  phoneNote: "Звонок по Беларуси бесплатный",
  email: "dmitry.sed13@gmail.com",
  hours: [
    { days: "пн–пт", time: "9:00–21:00" },
    { days: "сб–вс", time: "11:00–19:00" },
  ],
  currentWebsite: "https://europart.by/",
  sourceCheckedOn: "2026-11-03",
} as const;

export function formatAddress(): string {
  return `${company.city}, ${company.streetAddress}`;
}
