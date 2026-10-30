import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";

const inter = Inter({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "USAPARTS — автозапчасти из США", template: "%s | USAPARTS" },
  description: "Новые и контрактные автозапчасти из США. Поиск по VIN, OEM и каталогу автомобиля.",
  openGraph: { type: "website", locale: "ru_RU", siteName: "USAPARTS" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
