/**
 * Public company facts taken from https://europart.by/ on 3 November 2026.
 * Bank details, tax number and legal documents were not published there.
 * Payment brands listed on the old site are not repeated here until the owner confirms them.
 */
export const company = {
  brand: "EUROPART",
  legalName: "ООО «БелТРЭК»",
  city: "Брест",
  streetAddress: "ул. Московская, 364",
  country: "Беларусь",
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
