import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonClassName } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="py-24">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Страница не найдена
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-ink-muted">
        Такой страницы нет. Откройте каталог или вернитесь на главную.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link className={buttonClassName("primary")} href="/catalog">
          Каталог
        </Link>
        <Link className={buttonClassName("secondary")} href="/">
          На главную
        </Link>
      </div>
    </Container>
  );
}
