export function GarageArt() {
  return (
    <div className="relative">
      <svg viewBox="0 0 760 390" role="img" aria-label="Силуэт купе и схема тормозного диска" className="h-auto w-full">
        <defs>
          <linearGradient id="body-paint" x1="80" y1="80" x2="680" y2="280" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f7f3ea" />
            <stop offset="1" stopColor="#c5ced8" />
          </linearGradient>
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <text x="36" y="210" fill="rgba(244,240,232,0.05)" fontFamily="Oswald, sans-serif" fontSize="168">
          USA
        </text>

        <ellipse cx="390" cy="318" rx="250" ry="16" fill="#ff6b00" opacity="0.16" filter="url(#glow)" />
        <path d="M70 312h620" stroke="rgba(244,240,232,0.16)" strokeDasharray="2 8" />

        <g transform="translate(78 36)" fill="none" stroke="#ff6b00" strokeWidth="1.6">
          <circle cx="42" cy="42" r="38" />
          <circle cx="42" cy="42" r="14" />
          <path d="M42 8v10M42 66v10M8 42h10M66 42h10" />
          <text x="92" y="38" fill="#a3adb8" stroke="none" fontFamily="Oswald, sans-serif" fontSize="14" letterSpacing="1.5">
            ТОРМОЗА
          </text>
          <text x="92" y="58" fill="#f4f0e8" stroke="none" fontFamily="Manrope, sans-serif" fontSize="13">
            диски, суппорты, ABS
          </text>
        </g>

        <g>
          <path
            fill="url(#body-paint)"
            d="M78 250h62l34-28c28-22 62-42 118-52h132c62 2 112 18 156 46l58 38h46c14 0 20 14 12 24H70c-12-2-16-14 8-28Z"
          />
          <path fill="#14110e" d="M214 196l58-32h148l62 34H214Z" />
          <path d="M430 164v86" stroke="#8d98a4" strokeWidth="2" opacity="0.7" />
          <path d="M168 232h430" stroke="#8d98a4" strokeWidth="3" opacity="0.35" />
          <rect x="642" y="214" width="22" height="10" rx="2" fill="#ff6b00" />
          <ellipse cx="668" cy="219" rx="34" ry="10" fill="#ff6b00" opacity="0.45" filter="url(#glow)" />

          <g>
            <circle cx="196" cy="262" r="40" fill="#101318" />
            <circle cx="196" cy="262" r="27" fill="none" stroke="#d7dde4" strokeWidth="6" />
            <circle cx="196" cy="262" r="8" fill="#ff6b00" />
            <circle cx="575" cy="262" r="40" fill="#101318" />
            <circle cx="575" cy="262" r="27" fill="none" stroke="#d7dde4" strokeWidth="6" />
            <circle cx="575" cy="262" r="8" fill="#ff6b00" />
          </g>
        </g>
      </svg>

      <div className="mt-1 grid grid-cols-2 gap-3">
        <div className="border border-line bg-ink/70 px-3 py-3 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mist">Авиадоставка</p>
          <p className="mt-1 font-display text-2xl leading-none">5–7 дней</p>
        </div>
        <div className="border border-line bg-ink/70 px-3 py-3 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mist">Подбор по VIN</p>
          <p className="mt-1 font-display text-2xl leading-none">10 минут</p>
        </div>
      </div>
    </div>
  );
}
