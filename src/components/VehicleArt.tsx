import { useId } from "react";
import type { SeoPage } from "../seo/types.ts";

const bodies: Record<NonNullable<SeoPage["visual"]>, string> = {
  sedan: "M18 118h36l22-18c18-14 40-24 70-28h78c36 0 62 10 86 26l34 22h28c8 0 12 8 6 14H16c-8 0-10-8 2-16Z",
  crossover: "M16 122h28l16-28c10-16 28-28 52-34h92c28 0 48 8 66 22l28 24h40c10 0 14 8 8 14H14c-6 0-8-6 2-8Z",
  suv: "M20 124h24l8-36h150l10 36h42c8 0 10 8 4 12H16c-6 0-8-6 4-12Z",
  coupe: "M24 124h40l18-10c22-16 48-40 92-48h70c28 4 52 16 74 36l22 22h22c8 0 10 8 4 12H20c-8-2-10-8 4-12Z",
  wagon: "M16 120h30l14-24c12-16 30-26 54-30h120c8 0 14 6 14 14v40h36c8 0 12 8 6 12H14c-8 0-10-8 2-12Z",
  ev: "M18 118h34l20-16c16-12 38-22 66-26h84c32 0 56 8 78 24l30 20h26c8 0 12 8 6 14H16c-8 0-10-8 2-16Z",
};

type VehicleArtProps = {
  style: NonNullable<SeoPage["visual"]>;
  label: string;
};

export function VehicleArt({ style, label }: VehicleArtProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 420 180" role="img" aria-label={label} className="h-auto w-full">
      <defs>
        <linearGradient id={`${id}-paint`} x1="40" y1="40" x2="360" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7f3ea" />
          <stop offset="1" stopColor="#c5ced8" />
        </linearGradient>
      </defs>
      <ellipse cx="210" cy="152" rx="150" ry="8" fill="#ff6b00" opacity="0.18" />
      <path d="M24 156h372" stroke="rgba(244,240,232,0.16)" strokeDasharray="2 8" />
      <path fill={`url(#${id}-paint)`} d={bodies[style]} />
      <circle cx="118" cy="146" r="16" fill="#14110e" stroke="#ff6b00" strokeWidth="3" />
      <circle cx="300" cy="146" r="16" fill="#14110e" stroke="#ff6b00" strokeWidth="3" />
      {style === "ev" ? (
        <path d="M336 78h18v10h8v14h-8v8h-18v-8h-8V88h8V78Z" fill="#ff6b00" />
      ) : null}
    </svg>
  );
}
