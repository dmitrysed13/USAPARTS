import { ArrowRight, BadgeCheck, Plane, ShieldCheck } from "lucide-react";
import { GarageArt } from "./GarageArt.tsx";
import { Container } from "./ui.tsx";

type HeroProps = {
  onPick: () => void;
  onCalculate: () => void;
};

const points = [
  { icon: ShieldCheck, label: "Дилеры и аукционы США" },
  { icon: Plane, label: "Авиа от 5 дней" },
  { icon: BadgeCheck, label: "Договор и страховка груза" },
];

export function Hero({ onPick, onCalculate }: HeroProps) {
  return (
    <Container className="relative pb-6 pt-8 sm:pt-12 lg:pb-8 lg:pt-14">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-10">
        <div>
          <p className="eyebrow">Запчасти из США</p>
          <h1 className="display mt-4 max-w-3xl text-balance">
            Оригинальные запчасти для американских авто с доставкой от 5 дней
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-mist sm:text-lg">
            Новые и б/у детали для Ford, Chevrolet, Dodge, Jeep, Tesla, Cadillac, GMC, Chrysler, Lincoln напрямую из
            США. Подбор по VIN-коду за 10 минут.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn btn-primary" onClick={onPick}>
              Подобрать запчасть
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button type="button" className="btn btn-ghost" onClick={onCalculate}>
              Рассчитать стоимость
            </button>
          </div>
          <ul className="mt-7 flex flex-col gap-2 text-sm text-mist sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            {points.map((point) => (
              <li key={point.label} className="inline-flex items-center gap-2">
                <point.icon className="h-4 w-4 shrink-0 text-ember" strokeWidth={1.75} aria-hidden="true" />
                {point.label}
              </li>
            ))}
          </ul>
        </div>
        <GarageArt />
      </div>
    </Container>
  );
}
